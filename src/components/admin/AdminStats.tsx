import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Video, Users, DollarSign } from "lucide-react";

export const AdminStats = () => {
  // These will be connected to your Firebase data later
  const stats = [
    {
      title: "Total Books",
      value: "2",
      icon: Book,
      description: "Digital medical books"
    },
    {
      title: "Total Videos",
      value: "34",
      icon: Video,
      description: "Medical procedure videos"
    },
    {
      title: "Active Subscribers",
      value: "23",
      icon: Users,
      description: "Current subscribers"
    },
    {
      title: "Monthly Revenue",
      value: "$12,456",
      icon: DollarSign,
      description: "This month's earnings"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};