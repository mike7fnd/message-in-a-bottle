'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, getDocs, getFirestore, query, orderBy, Timestamp } from 'firebase/firestore';
import { BarChart, Users, MessageSquare, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { type Message, type Visit, getVisits } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


type LocationStat = {
    name: string;
    count: number;
    cities: { name: string; count: number }[];
};

type Stats = {
  totalMessages: number;
  totalRecipients: number;
  dailyMessages: { date: string; count: number }[];
  recentMessages: Message[];
  topLocations: LocationStat[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const db = getFirestore();
      try {
        const messagesQuery = query(collection(db, 'public_messages'), orderBy('timestamp', 'desc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        const allMessages: Message[] = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp as Timestamp;
            return {
                id: doc.id,
                content: data.content,
                recipient: data.recipient,
                timestamp: timestamp?.toDate(),
                senderId: data.senderId,
            }
        });

        const totalMessages = allMessages.length;

        const recipients = new Set(allMessages.map(msg => msg.recipient));
        const totalRecipients = recipients.size;

        const dailyCounts: { [key: string]: number } = {};
        for (let i = 0; i < 7; i++) {
          const date = startOfDay(subDays(new Date(), i));
          dailyCounts[format(date, 'MMM d')] = 0;
        }

        allMessages.forEach(msg => {
            if (msg.timestamp && msg.timestamp >= startOfDay(subDays(new Date(), 6))) {
                const day = format(startOfDay(msg.timestamp), 'MMM d');
                if (day in dailyCounts) {
                    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                }
            }
        });
        
        const dailyMessages = Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).reverse();
        
        const recentMessages = allMessages.slice(0, 5);

        // Fetch and process visit data
        const allVisits = await getVisits();
        const locationCounts: { [country: string]: { count: number, cities: { [city: string]: number } } } = {};
        
        allVisits.forEach(visit => {
            if (!locationCounts[visit.country]) {
                locationCounts[visit.country] = { count: 0, cities: {} };
            }
            locationCounts[visit.country].count++;
            
            if (!locationCounts[visit.country].cities[visit.city]) {
                locationCounts[visit.country].cities[visit.city] = 0;
            }
            locationCounts[visit.country].cities[visit.city]++;
        });

        const topLocations = Object.entries(locationCounts)
            .map(([country, data]) => ({
                name: country,
                count: data.count,
                cities: Object.entries(data.cities)
                    .map(([city, count]) => ({ name: city, count }))
                    .sort((a, b) => b.count - a.count)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);


        setStats({ totalMessages, totalRecipients, dailyMessages, recentMessages, topLocations });

      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const engagement = (stats && stats.totalRecipients > 0) ? (stats.totalMessages / stats.totalRecipients).toFixed(2) : '0.00';

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{stats?.totalMessages ?? '0'}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{stats?.totalRecipients ?? '0'}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                  <div>
                      <div className="text-2xl font-bold">{engagement}</div>
                      <p className="text-xs text-muted-foreground">messages per recipient</p>
                  </div>
              )}
          </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{stats?.topLocations.reduce((acc, loc) => acc + loc.count, 0) ?? '0'}</div>}
            </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
              <CardHeader>
                  <CardTitle>Messages Over Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                  {isLoading ? (
                       <div className="flex h-[350px] w-full items-center justify-center">
                          <Skeleton className="h-full w-full" />
                       </div>
                  ) : (
                      <ResponsiveContainer width="100%" height={350}>
                          <RechartsBarChart data={stats?.dailyMessages}>
                              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} allowDecimals={false} />
                              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                      </ResponsiveContainer>
                  )}
              </CardContent>
          </Card>
          <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>The last 5 messages sent.</CardDescription>
              </CardHeader>
              <CardContent>
                  {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div className="flex items-center space-x-4" key={i}>
                             <div className="space-y-2">
                               <Skeleton className="h-4 w-[150px]" />
                               <Skeleton className="h-4 w-[100px]" />
                             </div>
                           </div>
                         ))}
                      </div>
                  ) : (
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Recipient</TableHead>
                                  <TableHead>Date</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {stats?.recentMessages.map(msg => (
                                  <TableRow key={msg.id}>
                                      <TableCell>
                                          <div className="font-medium capitalize">{msg.recipient}</div>
                                          <div className="text-sm text-muted-foreground truncate w-48">{msg.content}</div>
                                      </TableCell>
                                      <TableCell className="text-right">{msg.timestamp ? format(msg.timestamp, 'MMM d, HH:mm') : 'N/A'}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  )}
              </CardContent>
          </Card>
           <Card className="lg:col-span-7">
                <CardHeader>
                    <CardTitle>Top Visitor Locations</CardTitle>
                    <CardDescription>Top countries and cities visiting the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {stats?.topLocations && stats.topLocations.length > 0 ? (
                                stats.topLocations.map(location => (
                                    <Collapsible key={location.name} className="group">
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between rounded-md border p-4 cursor-pointer hover:bg-muted/50">
                                                <div className="flex items-center gap-4">
                                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                                    <span className="font-semibold">{location.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-muted-foreground">{location.count} visits</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="pl-12">City</TableHead>
                                                        <TableHead className="text-right">Visits</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {location.cities.map(city => (
                                                        <TableRow key={city.name}>
                                                            <TableCell className="pl-12 font-medium">{city.name}</TableCell>
                                                            <TableCell className="text-right">{city.count}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No visitor data available yet.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
      </div>
    </>
  );
}
