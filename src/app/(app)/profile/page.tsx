

'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from "@/components/layout/header";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from 'firebase/auth';

const profileSchema = z.object({
  displayName: z.string().min(3, { message: '昵称必须至少为3个字符。' }),
  displayName_lowercase: z.string().optional(),
  email: z.string().email().optional(),
  bio: z.string().max(160, { message: '个人简介必须在160个字符以内。' }).optional(),
  age: z.coerce.number().min(0).optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  avatarId: z.string().optional(),
  imageBase64: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type UserProfile = {
  displayName: string;
  displayName_lowercase?: string;
  email?: string;
  avatarId: string;
  avatarUrl?: string; 
  imageBase64?: string;
  bio?: string;
  age?: number;
  gender?: string;
  address?: string;
};

const defaultAvatars = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        displayName: '',
        displayName_lowercase: '',
        email: '',
        bio: '',
        age: undefined,
        gender: '',
        address: '',
        avatarId: '',
        imageBase64: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      // Backfill email if it's missing in Firestore but present in auth
      if (!userProfile.email && user?.email && userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, { email: user.email });
      }

      form.reset({
        displayName: userProfile.displayName || '',
        displayName_lowercase: userProfile.displayName_lowercase || '',
        email: userProfile.email || user?.email || '', // Fallback to auth email
        bio: userProfile.bio || '',
        age: userProfile.age || undefined,
        gender: userProfile.gender || '',
        address: userProfile.address || '',
        avatarId: userProfile.avatarId || '',
        imageBase64: userProfile.imageBase64 || '',
      });
    } else if (user) {
        // Pre-fill from auth if profile is not yet created
        form.reset({
            displayName: user.displayName || '',
            email: user.email || '',
        })
    }
  }, [userProfile, user, form, userProfileRef]);
  
  const handleAvatarSelect = (avatarId: string) => {
    form.setValue('avatarId', avatarId, { shouldDirty: true });
    form.setValue('imageBase64', '', { shouldDirty: true }); 
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: '图片过大',
          description: '请上传小于5MB的图片。',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue('imageBase64', base64String, { shouldDirty: true });
        form.setValue('avatarId', '', { shouldDirty: true }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userProfileRef || !firestore || !user) return;
    setIsSaving(true);

    const updatedData: Partial<ProfileFormValues> = { 
        ...data,
        displayName_lowercase: data.displayName.toLowerCase(),
        email: user.email || data.email, // Always use the auth email
    };
    
    // Ensure only one of avatarId or imageBase64 is saved
    if (updatedData.imageBase64) {
      updatedData.avatarId = '';
    } else {
      updatedData.imageBase64 = '';
    }

    // This updates the main user profile document non-blockingly
    updateDocumentNonBlocking(userProfileRef, updatedData);
    
    const avatarChanged = data.avatarId !== userProfile?.avatarId || data.imageBase64 !== userProfile?.imageBase64;

    if (avatarChanged) {
        const batch = writeBatch(firestore);

        try {
            // Define queries for user's content
            const postsQuery = query(collection(firestore, 'posts'), where('authorId', '==', user.uid));
            const commentsInPostsQuery = query(collection(firestore, 'posts'), where('commentCount', '>', 0)); // Only get posts with comments
            const wallMessagesQuery = query(collection(firestore, 'wallMessages'), where('authorId', '==', user.uid));
            const chatsQuery = query(collection(firestore, 'chats'), where('participantIds', 'array-contains', user.uid));
            
            // Fetch all content types that need updating
            const [postsSnapshot, commentedPostsSnapshot, wallMessagesSnapshot, chatsSnapshot] = await Promise.all([
                getDocs(postsQuery),
                getDocs(commentsInPostsQuery),
                getDocs(wallMessagesQuery),
                getDocs(chatsSnapshot)
            ]);
            
            const avatarUpdatePayload = {
              authorImageBase64: data.imageBase64 || "",
              authorAvatarId: data.avatarId || ""
            };

            // Update posts
            postsSnapshot.forEach(postDoc => {
                const postRef = doc(firestore, 'posts', postDoc.id);
                batch.update(postRef, avatarUpdatePayload);
            });
            
            // Update comments where user is the author
            for (const postDoc of commentedPostsSnapshot.docs) {
                const commentsQuery = query(collection(firestore, "posts", postDoc.id, "comments"), where("authorId", "==", user.uid));
                const commentsSnapshot = await getDocs(commentsQuery);
                commentsSnapshot.forEach(commentDoc => {
                    const commentRef = doc(firestore, "posts", postDoc.id, "comments", commentDoc.id);
                    batch.update(commentRef, avatarUpdatePayload);
                });
            }

            // Update wall messages (if they stored avatar info, which they don't currently)

            // Update participantInfo in chats
            chatsSnapshot.forEach(chatDoc => {
                const chatRef = doc(firestore, 'chats', chatDoc.id);
                const chatData = chatDoc.data();
                const participantInfoUpdate = {
                    [`participantInfo.${user.uid}.imageBase64`]: data.imageBase64 || "",
                    [`participantInfo.${user.uid}.avatarId`]: data.avatarId || ""
                };
                batch.update(chatRef, participantInfoUpdate);
            });


            await batch.commit();

        } catch (error) {
            console.error("更新用户内容时出错:", error);
            const permissionError = new FirestorePermissionError({
                path: '用户内容的批量更新',
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }


    toast({ title: '个人资料更新已启动！' });
    form.reset(data);
    setIsSaving(false);
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const watchedAvatarId = form.watch('avatarId');
  const watchedImageBase64 = form.watch('imageBase64');
  
  const currentAvatarUrl = watchedImageBase64 || PlaceHolderImages.find(img => img.id === watchedAvatarId)?.imageUrl;
  
  return (
    <div className="flex flex-col h-full">
      <Header title="我的个人资料" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        {currentAvatarUrl && <AvatarImage src={currentAvatarUrl} alt={form.watch('displayName')} />}
                        <AvatarFallback>
                            <UserIcon className="h-12 w-12"/>
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-3xl font-headline">{form.watch('displayName')}</CardTitle>
                        <CardDescription>管理您的个人资料设置和个人信息。</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <h3 className="font-semibold">更换头像</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        {defaultAvatars.map(avatar => (
                            <button key={avatar.id} onClick={() => handleAvatarSelect(avatar.id)}>
                                <Avatar className={`h-16 w-16 transition-transform hover:scale-110 ${watchedAvatarId === avatar.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                    <AvatarImage src={avatar.imageUrl} alt={avatar.description} />
                                    <AvatarFallback>{avatar.id.slice(-1)}</AvatarFallback>
                                </Avatar>
                            </button>
                        ))}
                         <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                        />
                        <Button variant="outline" onClick={() => imageInputRef.current?.click()}>上传图片</Button>
                    </div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>更新您的详细信息。您的昵称和邮箱无法更改。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">昵称</Label>
                        <Input id="displayName" {...form.register('displayName')} disabled />
                        {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">邮箱</Label>
                        <Input id="email" {...form.register('email')} disabled />
                         {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">年龄</Label>
                        <Input id="age" type="number" {...form.register('age')} />
                         {form.formState.errors.age && <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">性别</Label>
                        <Controller
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择你的性别" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">男</SelectItem>
                                        <SelectItem value="Female">女</SelectItem>
                                        <SelectItem value="Other">其他</SelectItem>
                                        <SelectItem value="Prefer not to say">不愿透露</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">地址</Label>
                        <Input id="address" {...form.register('address')} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">个人简介</Label>
                        <Textarea id="bio" {...form.register('bio')} />
                        {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存更改
                    </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

