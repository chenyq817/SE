
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
import { MoreHorizontal, Eye, Newspaper, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { collection, query, orderBy, doc, getDocs, where } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { newsItems } from '@/lib/news-data';

type ContentItem = {
    id: string;
    type: '帖子' | '留言';
    authorId: string;
    authorName: string;
    content: string;
    createdAt: any;
};

type UserProfile = WithId<{
  displayName: string;
  avatarId: string;
  imageBase64?: string;
}>;


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
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

    const fetchAllData = async () => {
        setIsContentLoading(true);
        try {
            // Fetch posts
            const postsQuery = query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = postsSnapshot.docs.map(doc => ({
                ...(doc.data() as any),
                id: doc.id,
                type: '帖子' as const,
            }));

            // Fetch wall messages
            const wallMessagesQuery = query(collection(firestore, 'wallMessages'), orderBy('createdAt', 'desc'));
            const wallMessagesSnapshot = await getDocs(wallMessagesQuery);
            const wallMessagesData = wallMessagesSnapshot.docs.map(doc => ({
                ...(doc.data() as any),
                id: doc.id,
                type: '留言' as const,
            }));

            // Combine and sort content
            const combinedContent = [...postsData, ...wallMessagesData]
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

            setAllContent(combinedContent);
            
            // Fetch users
            const usersQuery = query(collection(firestore, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
              .filter(u => u.id !== user.uid); // Filter out admin
            
            setAllUsers(usersData);

        } catch (error) {
            console.error("获取管理员面板数据时出错:", error);
        } finally {
            setIsContentLoading(false);
        }
    };

    fetchAllData();
  }, [firestore, user]);


  const handleDelete = (item: ContentItem) => {
    if (!firestore) return;
    const collectionName = item.type === '帖子' ? 'posts' : 'wallMessages';
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
      <Header title="管理后台" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>新闻管理</CardTitle>
                <CardDescription>创建和管理静态新闻内容。</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/create-news">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  发布新新闻
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>标题</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead>发布日期</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {newsItems.slice(0, 5).map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{item.category}</Badge>
                                </TableCell>
                                <TableCell>{item.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {!isLoading && newsItems.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        暂无新闻。
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>查看和管理所有已注册用户。</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>头像</TableHead>
                            <TableHead>昵称</TableHead>
                            <TableHead><span className="sr-only">操作</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.map(profile => {
                          const avatarSrc = profile.imageBase64 || PlaceHolderImages.find(p => p.id === profile.avatarId)?.imageUrl;
                          return (
                            <TableRow key={profile.id}>
                                <TableCell>
                                  <Link href={`/profile/${profile.id}`}>
                                    <Avatar>
                                        <AvatarImage src={avatarSrc} alt={profile.displayName} />
                                        <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </Link>
                                </TableCell>
                                <TableCell className="font-medium">{profile.displayName}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/profile/${profile.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        查看资料
                                      </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                </Table>
                 {!isLoading && allUsers.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        未找到其他用户。
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>内容审核</CardTitle>
                <CardDescription>审核和管理所有用户提交的帖子和留言。</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>作者</TableHead>
                            <TableHead>内容</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead><span className="sr-only">操作</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allContent.map(item => (
                            <TableRow key={`${item.type}-${item.id}`}>
                                <TableCell className="font-medium">{item.authorName}</TableCell>
                                <TableCell className="truncate max-w-sm">{item.content}</TableCell>
                                <TableCell>
                                    <Badge variant={item.type === '帖子' ? 'secondary' : 'outline'}>
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">切换菜单</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDelete(item)}
                                            >
                                              删除
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
                        没有需要审核的内容。
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
