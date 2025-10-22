

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
      form.reset({
        displayName: userProfile.displayName || '',
        displayName_lowercase: userProfile.displayName_lowercase || '',
        bio: userProfile.bio || '',
        age: userProfile.age || undefined,
        gender: userProfile.gender || '',
        address: userProfile.address || '',
        avatarId: userProfile.avatarId || '',
        imageBase64: userProfile.imageBase64 || '',
      });
    }
  }, [userProfile, form]);
  
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
    };
    
    // Ensure only one of avatarId or imageBase64 is saved
    if (updatedData.imageBase64) {
      updatedData.avatarId = '';
    } else {
      updatedData.imageBase64 = '';
    }

    // This updates the main user profile document non-blockingly
    updateDocumentNonBlocking(userProfileRef, updatedData);
    
    // The rest of the logic performs a batch update for related content
    const nameChanged = false; // Name change is disabled
    const avatarChanged = data.avatarId !== userProfile?.avatarId || data.imageBase64 !== userProfile?.imageBase64;

    if (avatarChanged) {
        const batch = writeBatch(firestore);

        try {
            // Define queries for user's content
            const postsQuery = query(collection(firestore, 'posts'), where('authorId', '==', user.uid));
            const wallMessagesQuery = query(collection(firestore, 'wallMessages'), where('authorId', '==', user.uid));

            // Fetch all content types that need updating
            const [postsSnapshot, wallMessagesSnapshot] = await Promise.all([
                getDocs(postsQuery),
                getDocs(wallMessagesQuery)
            ]);
            
            const avatarUpdatePayload = {
              authorImageBase64: data.imageBase64 || "",
              authorAvatarId: data.avatarId || ""
            };

            // Update posts and collect post IDs for comment updates
            const postIds: string[] = [];
            postsSnapshot.forEach(postDoc => {
                postIds.push(postDoc.id);
                const postRef = doc(firestore, 'posts', postDoc.id);
                batch.update(postRef, avatarUpdatePayload);
            });

            // Update wall messages
            wallMessagesSnapshot.forEach(msgDoc => {
                const msgRef = doc(firestore, 'wallMessages', msgDoc.id);
                // Wall messages don't have avatar info, only authorName. If they did, it would be updated here.
            });
            
            // Now, update comments inside all user's posts
            for (const postId of postIds) {
                const commentsQuery = query(
                    collection(firestore, "posts", postId, "comments"),
                    where("authorId", "==", user.uid)
                );
                const commentsSnapshot = await getDocs(commentsQuery);
                commentsSnapshot.forEach(commentDoc => {
                    const commentRef = doc(firestore, "posts", postId, "comments", commentDoc.id);
                    batch.update(commentRef, avatarUpdatePayload);
                });
            }

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
                <CardDescription>更新您的详细信息。您的昵称无法更改。</CardDescription>
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
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">年龄</Label>
                        <Input id="age" type="number" {...form.register('age')} />
                         {form.formState.errors.age && <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">性别</Label>Show in original language