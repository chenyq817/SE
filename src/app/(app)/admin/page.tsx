import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { MoreHorizontal, Users, FileText, BarChart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const recentPosts = [
    { id: 'POST-8782', user: 'Alice', type: 'Confession', status: 'Approved', content: "Feeling homesick this week..."},
    { id: 'POST-8781', user: 'Bob', type: 'Social', status: 'Pending', content: "Tried the new latte..."},
    { id: 'POST-8780', user: 'Charlie', type: 'Social', status: 'Flagged', content: "Late night grind..."},
];

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Users" value="12,483" icon={Users} />
            <StatCard title="Posts Today" value="573" icon={FileText} />
            <StatCard title="Active Users (24h)" value="2,104" icon={BarChart} />
        </div>
        
        <Tabs defaultValue="moderation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>
            <TabsContent value="moderation">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Posts</CardTitle>
                        <CardDescription>Review and manage user-submitted content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Post ID</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPosts.map(post => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.id}</TableCell>
                                        <TableCell>{post.user}</TableCell>
                                        <TableCell>{post.type}</TableCell>
                                        <TableCell>
                                            <Badge variant={post.status === 'Flagged' ? 'destructive' : post.status === 'Pending' ? 'secondary' : 'default'}>{post.status}</Badge>
                                        </TableCell>
                                        <TableCell className="truncate max-w-xs">{post.content}</TableCell>
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
                                                    <DropdownMenuItem>Approve</DropdownMenuItem>
                                                    <DropdownMenuItem>Delete</DropdownMenuItem>
                                                    <DropdownMenuItem>Ban User</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="users">
                <div className="text-center py-16">
                    <p className="text-muted-foreground">User management tools will be here.</p>
                </div>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
