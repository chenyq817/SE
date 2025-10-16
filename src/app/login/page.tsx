
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2 } from 'lucide-react';
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

const defaultAvatars = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4'];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Firebase not initialized',
            description: 'Please try again later.',
        });
        setIsLoading(false);
        return;
    }
    try {
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: 'Sign in successful!' });
        router.push('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const newUser = userCredential.user;
        
        const userProfileRef = doc(firestore, 'users', newUser.uid);
        const randomAvatarId = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
        
        await setDocumentNonBlocking(userProfileRef, {
          displayName: values.email.split('@')[0],
          avatarId: randomAvatarId,
          bio: '',
          age: null,
          gender: 'Prefer not to say',
          address: '',
          avatarUrl: null,
        }, {});

        toast({ title: 'Sign up successful! Please sign in.' });
        setActiveTab('signin'); 
        form.reset();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <CardHeader className="items-center text-center">
             <Bot className="w-12 h-12 text-primary mb-2" />
            <CardTitle className="text-2xl font-headline">Welcome to Yu Garden Echo</CardTitle>
            <CardDescription>Your all-in-one campus companion.</CardDescription>
        </CardHeader>
        <div className='flex justify-center'>
            <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm form={form} onSubmit={onSubmit} isLoading={isLoading} buttonText="Sign In" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm form={form} onSubmit={onSubmit} isLoading={isLoading} buttonText="Sign Up" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


interface AuthFormProps {
    form: ReturnType<typeof useForm<FormValues>>;
    onSubmit: (values: FormValues) => void;
    isLoading: boolean;
    buttonText: string;
}

function AuthForm({ form, onSubmit, isLoading, buttonText }: AuthFormProps) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
            </Button>
            </form>
      </Form>
    )
}

    