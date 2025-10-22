import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Newspaper, Users, MessageSquare, FileText } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HomePage() {
  const campusImage = PlaceHolderImages.find(img => img.id === 'news-2');

  const navItems = [
    {
      href: "/news",
      icon: Newspaper,
      title: "校园新闻",
      description: "了解最新的校园新闻和活动。",
      color: "bg-blue-100 dark:bg-blue-900/50",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      href: "/post",
      icon: FileText,
      title: "校园帖子",
      description: "看看正在发生什么，分享你的瞬间。",
       color: "bg-green-100 dark:bg-green-900/50",
       textColor: "text-green-600 dark:text-green-400"
    },
    {
      href: "/social",
      icon: Users,
      title: "社交中心",
      description: "寻找朋友，管理联系人，开始聊天。",
      color: "bg-yellow-100 dark:bg-yellow-900/50",
      textColor: "text-yellow-600 dark:text-yellow-400"
    },
    {
      href: "/community",
      icon: MessageSquare,
      title: "社区墙",
      description: "留下一条公开信息，让所有人看到。",
      color: "bg-purple-100 dark:bg-purple-900/50",
      textColor: "text-purple-600 dark:text-purple-400"
    },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/50">
      <Header title="主页" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <section
          className="rounded-xl border bg-card text-card-foreground shadow-lg w-full p-8 md:p-12 bg-gradient-to-r from-primary to-blue-600"
        >
          <div className="flex flex-col items-start text-white">
            <h2 className="text-4xl font-bold font-headline">欢迎来到“喻园回声”</h2>
            <p className="mt-2 text-lg text-gray-200">明德厚学，求是创新</p>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} passHref>
              <Card className="h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-transform duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}>
                     <item.icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
