
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, User, ArrowLeft, Cake, VenetianMask, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UserProfile = {
  displayName: string;
  avatarId: string;
  imageBase64?: string;
  bio?: string;
  age?: number;
  gender?: string;
  address?: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const userId = params.userId as string;

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col h-full">
        <Header title="User Not Found" />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-lg text-muted-foreground">This user profile could not be found.</p>
           <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </main>
      </div>
    );
  }
  
  const profileAvatarSrc = userProfile.imageBase64 || PlaceHolderImages.find(p => p.id === userProfile.avatarId)?.imageUrl;

  return (
    <div className="flex flex-col h-full">
      <Header title={`${userProfile.displayName}'s Profile`} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="p-0">
               <div className="relative h-48 w-full bg-muted">
                 {profileAvatarSrc && (
                    <Image 
                      src={profileAvatarSrc}
                      alt="Profile banner"
                      fill
                      className="object-cover object-center blur-md opacity-50"
                    />
                 )}
               </div>
               <div className="relative flex flex-col items-center p-6 -mt-20 space-y-2">
                 <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                    {profileAvatarSrc && <AvatarImage src={profileAvatarSrc} alt={userProfile.displayName} />}
                    <AvatarFallback className="text-4xl">
                        {userProfile.displayName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <CardTitle className="text-3xl font-headline">{userProfile.displayName}</CardTitle>
                  {userProfile.bio && <CardDescription className="mt-2 text-lg">{userProfile.bio}</CardDescription>}
                </div>
               </div>
            </CardHeader>
            <CardContent className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {userProfile.age && (
                  <div className="flex items-center gap-3">
                    <Cake className="w-5 h-5 text-muted-foreground"/>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{userProfile.age}</span>
                  </div>
                )}
                {userProfile.gender && userProfile.gender !== "Prefer not to say" && (
                  <div className="flex items-center gap-3">
                    <VenetianMask className="w-5 h-5 text-muted-foreground"/>
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium">{userProfile.gender}</span>
                  </div>
                )}
                {userProfile.address && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-muted-foreground"/>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{userProfile.address}</span>
                  </div>
                )}
                {!userProfile.age && !userProfile.gender && !userProfile.address && (
                    <p className="text-muted-foreground text-center col-span-full">This user hasn't shared any additional information.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
