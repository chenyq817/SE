

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
  displayName: z.string().min(3, { message: 'Display name must be at least 3 characters.' }),
  bio: z.string().max(160, { message: 'Bio must be 160 characters or less.' }).optional(),
  age: z.coerce.number().min(0).optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  avatarId: z.string().optional(),
  imageBase64: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type UserProfile = {
  displayName: string;
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
      if (file.size > 1048487) {
        toast({
          variant: 'destructive',
          title: 'Image is too large',
          description: 'Please upload an image smaller than 1MB.',
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

    const updatedData: Partial<ProfileFormValues> = { ...data };
    
    if (updatedData.imageBase64 === '') {
      delete updatedData.imageBase64;
    }

    if (user.displayName !== data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
    }

    updateDocumentNonBlocking(userProfileRef, updatedData);

    const nameChanged = data.displayName !== userProfile?.displayName;
    const avatarChanged = data.avatarId !== userProfile?.avatarId || data.imageBase64 !== userProfile?.imageBase64;

    if (nameChanged || avatarChanged) {
        const postsRef = collection(firestore, 'posts');
        const commentsRef = collection(firestore, 'wallMessages');

        const userPostsQuery = query(postsRef, where('authorId', '==', user.uid));
        const userCommentsQuery = query(commentsRef, where('authorId', '==', user.uid));

        try {
            const [postsSnapshot, commentsSnapshot] = await Promise.all([
                getDocs(userPostsQuery),
                getDocs(userCommentsQuery),
            ]);
            
            const batch = writeBatch(firestore);

            if (!postsSnapshot.empty) {
                postsSnapshot.forEach(postDoc => {
                    const postRef = doc(firestore, 'posts', postDoc.id);
                    const updatePayload: any = {};
                    if(nameChanged) updatePayload.authorName = data.displayName;
                    if(avatarChanged) {
                         updatePayload.authorAvatarId = data.avatarId;
                         updatePayload.authorImageBase64 = data.imageBase64;
                    }
                    batch.update(postRef, updatePayload);
                });
            }

            if (!commentsSnapshot.empty) {
                commentsSnapshot.forEach(commentDoc => {
                    const commentRef = doc(firestore, 'wallMessages', commentDoc.id);
                    if(nameChanged) {
                        batch.update(commentRef, { authorName: data.displayName });
                    }
                });
            }

            if (!postsSnapshot.empty || !commentsSnapshot.empty) {
                 batch.commit().catch(error => {
                    const permissionError = new FirestorePermissionError({
                      path: 'batch update',
                      operation: 'update',
                      requestResourceData: data,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: 'batch read',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }

    toast({ title: 'Profile update initiated!' });
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
      <Header title="My Profile" />
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
                        <CardDescription>Manage your profile settings and personal information.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <h3 className="font-semibold">Change Avatar</h3>
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
                        <Button variant="outline" onClick={() => imageInputRef.current?.click()}>Upload Image</Button>
                    </div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your details below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" {...form.register('displayName')} />
                        {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" {...form.register('age')} />
                         {form.formState.errors.age && <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Controller
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...form.register('address')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Signature</Label>
                  <Textarea id="bio" placeholder="Tell us a little about yourself" {...form.register('bio')} />
                   {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
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

    