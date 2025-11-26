'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 font-sans">
      <div className="w-full max-w-4xl space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Automation Hub</h1>
          <p className="text-lg text-gray-500">Select an automation tool to manage your campaigns.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Sale Automation */}
          <Link href="/sale-automation" className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer group-hover:scale-[1.02]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 text-2xl">
                  🍰
                </div>
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                  Google Ads Sale Automation
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </CardTitle>
                <CardDescription className="text-base">
                  Toggle "Sale" campaigns and asset groups across all markets. Enable or pause sales logic globally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Manage PMax & Demand Gen status</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Text Updates */}
          <Link href="/business-data" className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer group-hover:scale-[1.02]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-2xl">
                  📝
                </div>
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  Text Updates Automation
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </CardTitle>
                <CardDescription className="text-base">
                  Update business data text assets for specific sale phases like "Last Day" or "Start Sale".
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Bulk update headlines & descriptions</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: SBA Automation */}
          <Link href="/sba-automation" className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer group-hover:scale-[1.02]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 text-2xl">
                  📈
                </div>
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-green-600 transition-colors">
                  Seasonal Bid Adjustments
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </CardTitle>
                <CardDescription className="text-base">
                  Momentum Bidding: Auto-adjust bids based on daily performance trends vs yesterday.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span>Boost successful campaigns automatically</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 4: Budget Scaling */}
          <Link href="/scaling-automation" className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer group-hover:scale-[1.02]">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-2xl">
                  🚀
                </div>
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                  Budget Scaling
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </CardTitle>
                <CardDescription className="text-base">
                  Automatically scale budgets for high-performing campaigns hitting their daily spend cap.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Scale budgets based on utilization</span>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>

      </div>
    </main>
  );
}
