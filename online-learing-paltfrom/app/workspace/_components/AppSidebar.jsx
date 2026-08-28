"use client";
import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Book, CompassIcon, LayoutDashboard, PencilRulerIcon, UserCircle2Icon, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddNewCourseDialog from "./AddNewCourseDialog";

const sideBarOptions = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/workspace'
    },
    {
        title: 'My Learning',
        icon: Book,
        path: '/workspace/my-courses'
    },
    {
        title: 'Explore Courses',
        icon: CompassIcon,
        path: '/workspace/explore'
    },
    {
        title: 'AI Tools',
        icon: PencilRulerIcon,
        path: '/workspace/ai-tools'
    },
    {
        title: 'Billing',
        icon: WalletCards,
        path: '/workspace/billing'
    },
    {
        title: 'Profile',
        icon: UserCircle2Icon,
        path: '/workspace/profile'
    }
]

function AppSidebar() {

    const path = usePathname();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Image src={'/ai_learning_logo_only.svg'} alt="logo" width={40} height={40} />
                    <span className="text-xl font-bold">Online Learning</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <AddNewCourseDialog>
                        <Button>Create New Course</Button>
                    </AddNewCourseDialog>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarMenu>
                        {sideBarOptions.map((item, index) => {
                            const isActive = item.path === '/workspace'
                                ? path === '/workspace'
                                : path.includes(item.path);

                            return (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton asChild isActive={isActive}>
                                        <Link
                                            href={item.path}
                                            className={`text-[17px] ${isActive ? 'bg-gray-600 text-white font-semibold' : ''}`}
                                        >
                                            <item.icon className="h-7 w-7" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                    <SidebarGroupContent />
                </SidebarGroup>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

export default AppSidebar