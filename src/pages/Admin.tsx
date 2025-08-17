// src/pages/Admin.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookManager } from "@/components/admin/BookManager";
import { VideoManager } from "@/components/admin/VideoManager";
import { AdminStats } from "@/components/admin/AdminStats";
import AdminPendingPurchases from "@/components/admin/AdminPendingPurchases";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your digital medical content and subscriptions</p>
        </div>

        <AdminStats />

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="books">Books Management</TabsTrigger>
            <TabsTrigger value="videos">Videos Management</TabsTrigger>
            <TabsTrigger value="pending-purchases">Pending Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle>Digital Books</CardTitle>
                <CardDescription>Upload, edit, and manage your medical books</CardDescription>
              </CardHeader>
              <CardContent>
                <BookManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Medical Videos</CardTitle>
                <CardDescription>Upload, edit, and manage your medical procedure videos</CardDescription>
              </CardHeader>
              <CardContent>
                <VideoManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending-purchases">
            <Card>
              <CardHeader>
                <CardTitle>Pending Purchases</CardTitle>
                <CardDescription>Review and approve or deny user purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPendingPurchases />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
