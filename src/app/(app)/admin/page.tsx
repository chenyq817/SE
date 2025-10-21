
'use client';

import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { collection, query, orderBy, doc, getDocs } from "firebase/firestore";
import type { WithId } from "@/firebase";

type ContentItem = {
    id: string;
    type: 'Post' | 'Wall Message';
    authorId: string;
    authorName: string;
    content: string;
    createdAt: any;
};

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'admin@111.com') {
        router.push('/');
      }
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!firestore || !user || user.email !== 'admin@111.com') return;

    const fetchAllContent = async () => {
        setIsContentLoading(true);
        try {
            // Fetch posts
            const postsQuery = query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = postsSnapshot.docs.map(doc => ({
                ...(doc.data() as any),
                id: doc.id,
                type: 'Post' as const,
            }));

            // Fetch wall messages
            const wallMessagesQuery = query(collection(firestore, 'wallMessages'), orderBy('createdAt', 'desc'));
            const wallMessagesSnapshot = await getDocs(wallMessagesQuery);
            const wallMessagesData = wallMessagesSnapshot.docs.map(doc => ({
                ...(doc.data() as any),
                id: doc.id,
                type: 'Wall Message' as const,
            }));

            // Combine and sort
            const combinedContent = [...postsData, ...wallMessagesData]
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

            setAllContent(combinedContent);
        } catch (error) {
            console.error("Error fetching content for admin panel:", error);
        } finally {
            setIsContentLoading(false);
        }
    };

    fetchAllContent();
  }, [firestore, user]);


  const handleDelete = (item: ContentItem) => {
    if (!firestore) return;
    const collectionName = item.type === 'Post' ? 'posts' : 'wallMessages';
    const itemRef = doc(firestore, collectionName, item.id);
    deleteDocumentNonBlocking(itemRef);
    setAllContent(prevContent => prevContent.filter(content => content.id !== item.id));
  };

  const isLoading = isUserLoading || isContentLoading;

  if (isLoading || !user || user.email !== 'admin@111.com') {
     return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and manage all user-submitted posts and messages.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Author</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allContent.map(item => (
                            <TableRow key={`${item.type}-${item.id}`}>
                                <TableCell className="font-medium">{item.authorName}</TableCell>
                                <TableCell className="truncate max-w-sm">{item.content}</TableCell>
                                <TableCell>
                                    <Badge variant={item.type === 'Post' ? 'secondary' : 'outline'}>
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDelete(item)}
                                            >
                                              Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {!isLoading && allContent.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No content to moderate.
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
