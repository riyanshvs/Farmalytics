import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Newspaper,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  User,
  Filter,
  AlertCircle,
  Info,
  Zap,
  ChevronDown
} from "lucide-react";

// Mock news data - in production, this would come from backend API
const newsData = [
  {
    id: 1,
    title: "Maharashtra Government Announces New MSP Rates for Kharif Crops",
    summary: "The Maharashtra government has increased Minimum Support Prices (MSP) for major kharif crops including cotton, soybean, and tur dal by 5-7% to benefit farmers.",
    content: "The state government has revised MSP rates to ensure better returns for farmers. Cotton MSP increased to Rs6,050 per quintal, soybean to Rs4,250, and tur dal to Rs6,800. This move is expected to benefit over 2 million farmers across the state.",
    category: "Government Policy",
    priority: "high",
    publishedAt: "2024-03-08T10:30:00Z",
    author: "Agriculture Ministry",
    tags: ["MSP", "Kharif", "Maharashtra"],
    readTime: 3,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop"
  },
  {
    id: 2,
    title: "Heavy Rains Expected in Western Maharashtra This Week",
    summary: "Meteorological department predicts heavy rainfall in Konkan and Western Maharashtra regions, affecting farming activities.",
    content: "The India Meteorological Department (IMD) has forecasted heavy to very heavy rainfall in the Konkan region and parts of Western Maharashtra from March 10-15. Farmers are advised to take necessary precautions for crop protection and drainage management.",
    category: "Weather Alert",
    priority: "critical",
    publishedAt: "2024-03-08T08:15:00Z",
    author: "IMD Maharashtra",
    tags: ["Weather", "Rainfall", "Maharashtra"],
    readTime: 2,
    image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400&h=250&fit=crop"
  },
  {
    id: 3,
    title: "Organic Farming Adoption Increases by 25% in Pune District",
    summary: "Pune district sees significant rise in organic farming practices with government support and farmer training programs.",
    content: "According to recent data from the Department of Agriculture, Pune district has witnessed a 25% increase in organic farming adoption. Over 15,000 hectares of land are now under organic cultivation, with major crops including vegetables, fruits, and spices.",
    category: "Success Story",
    priority: "medium",
    publishedAt: "2024-03-07T16:45:00Z",
    author: "Pune Agriculture Office",
    tags: ["Organic Farming", "Pune", "Success"],
    readTime: 4,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop"
  },
  {
    id: 4,
    title: "New Pest Control Technology Introduced in Vidarbha Region",
    summary: "Advanced drone-based pest monitoring system launched to help cotton farmers combat bollworm infestations.",
    content: "The Central Institute for Cotton Research has introduced a cutting-edge drone technology for pest monitoring in Vidarbha. The system uses AI-powered cameras to detect early signs of pest attacks, enabling timely intervention and reducing pesticide use by up to 40%.",
    category: "Technology",
    priority: "medium",
    publishedAt: "2024-03-07T14:20:00Z",
    author: "CICR Nagpur",
    tags: ["Technology", "Pest Control", "Cotton"],
    readTime: 5,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop"
  },
  {
    id: 5,
    title: "Market Update: Onion Prices Surge Due to Export Demand",
    summary: "Onion prices in major markets have increased by 15-20% driven by strong export demand and reduced arrivals.",
    content: "Onion prices have shown significant upward movement in key markets. Lasalgaon mandi reported prices of Rs2,800-3,200 per quintal, while Pune market saw rates of Rs3,000-3,400. The increase is attributed to higher export orders and lower-than-expected arrivals from producing regions.",
    category: "Market Update",
    priority: "high",
    publishedAt: "2024-03-07T12:00:00Z",
    author: "Agri Market Intelligence",
    tags: ["Onion", "Prices", "Export"],
    readTime: 3,
    image: "https://images.unsplash.com/photo-1618375569909-3c8616cf09ae?w=400&h=250&fit=crop"
  }
];

const marketReports = [
  {
    id: 1,
    title: "Weekly Agricultural Commodity Report",
    summary: "Comprehensive analysis of major crop prices and market trends for the week ending March 8, 2024.",
    highlights: [
      "Cotton prices stable at Rs6,000-6,200/quintal",
      "Turmeric shows 8% price increase",
      "Soybean arrivals increase by 15%",
      "Groundnut prices remain firm"
    ],
    publishedAt: "2024-03-08T09:00:00Z",
    downloadUrl: "#"
  },
  {
    id: 2,
    title: "Monthly Crop Production Report - February 2024",
    summary: "Detailed production statistics and yield analysis for major crops across Maharashtra.",
    highlights: [
      "Sugarcane production up by 12%",
      "Cotton yield exceeds expectations",
      "Vegetable production shows mixed trends",
      "Rice procurement targets achieved"
    ],
    publishedAt: "2024-03-01T10:00:00Z",
    downloadUrl: "#"
  }
];

const NewsReports = () => {
  const [activeTab, setActiveTab] = useState("news");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [visibleNewsCount, setVisibleNewsCount] = useState(6);

  const handleRefresh = async () => {
    setIsLoading(true);
    // In production, this would call backend API to refresh news
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleLoadMore = () => {
    setVisibleNewsCount(prev => prev + 6);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <Zap className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const filteredNews = newsData.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || news.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const visibleNews = filteredNews.slice(0, visibleNewsCount);

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border/70 bg-card/95 p-3 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl mb-8 border border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              News & Information Hub
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 px-4">
              Stay updated with the latest agricultural news, market trends, and farming insights
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-6 shadow-inner">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 md:w-5 h-4 md:h-5" />
                <Input
                  placeholder="Search news, reports, and updates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 md:h-12 text-base md:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-green-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 h-10 md:h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Government Policy">Government Policy</SelectItem>
                    <SelectItem value="Weather Alert">Weather Alert</SelectItem>
                    <SelectItem value="Market Update">Market Update</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Success Story">Success Story</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-36 h-10 md:h-12">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="h-10 md:h-12 px-4 md:px-6">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-10 md:h-12">
            <TabsTrigger value="news" className="text-sm md:text-lg py-2 md:py-3">Latest News</TabsTrigger>
            <TabsTrigger value="reports" className="text-sm md:text-lg py-2 md:py-3">Market Reports</TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {visibleNews.map((news) => (
                <Card key={news.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <div className="relative">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-40 md:h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getPriorityColor(news.priority)} flex items-center gap-1 text-xs`}>
                        {getPriorityIcon(news.priority)}
                        <span className="hidden sm:inline capitalize">{news.priority}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2 md:pb-3 px-4 md:px-6 pt-4">
                    <Badge variant="outline" className="w-fit mb-2 text-xs">{news.category}</Badge>
                    <CardTitle className="text-base md:text-lg leading-tight hover:text-green-600 cursor-pointer transition-colors line-clamp-2">
                      {news.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 md:px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
                      {news.summary}
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 md:mb-4 gap-2">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{news.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {news.readTime}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">{formatDate(news.publishedAt)}</span>
                        <span className="sm:hidden">{new Date(news.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                      {news.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-sm">
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visibleNews.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <Newspaper className="w-16 md:w-20 h-16 md:h-20 text-gray-400 mx-auto mb-4 md:mb-6" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">No news found</h3>
                <p className="text-gray-600 dark:text-gray-300 px-4">Try adjusting your search or filter criteria.</p>
              </div>
            )}

            {visibleNews.length < filteredNews.length && (
              <div className="text-center pt-6 md:pt-8">
                <Button onClick={handleLoadMore} size="lg" className="px-6 md:px-8">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Load More News
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {marketReports.map((report) => (
                <Card key={report.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg md:text-xl mb-2">{report.title}</CardTitle>
                        <p className="text-green-100 mb-2 md:mb-3 text-sm md:text-base">{report.summary}</p>
                        <div className="flex items-center gap-2 text-sm text-green-100">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.publishedAt)}
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="bg-white text-green-600 hover:bg-gray-100 self-start flex-shrink-0">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">Key Highlights:</h4>
                      {report.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-2 md:gap-3 text-sm">
                          <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full mt-1.5 md:mt-2 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default NewsReports;