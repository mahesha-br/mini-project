import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar"
import Image from "next/image";
import { Button } from "@/components/ui/button";

function AppSidebar() {
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
                    <Button>Create New Course</Button>
                </SidebarGroup>

                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

export default AppSidebar