import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Newspaper,
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
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { safeJsonParse } from "@/lib/safeJson";

type NewsCategory = "weather" | "market_update" | "technology" | "success_story" | "policy";
type NewsPriority = "critical" | "high" | "medium" | "low";

type NewsItem = {
  id: number;
  title: string;
  summary: string;
  categoryKey: NewsCategory;
  priority: NewsPriority;
  publishedAt: string;
  author: string;
  tags?: string[];
  readTime?: number;
  image?: string;
  url?: string;
};

type MarketReport = {
  id: number;
  title: string;
  summary: string;
  highlights: string[];
  publishedAt: string;
  downloadUrl?: string;
};

const NEWS_POLL_INTERVAL_MS = Number(import.meta.env.VITE_NEWS_POLL_INTERVAL_MS || 60000);

const NewsReports = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [visibleNewsCount, setVisibleNewsCount] = useState(6);

  const language = useMemo(
    () => (i18n.language?.toLowerCase().startsWith("hi") ? "hi" : "en"),
    [i18n.language]
  );

  const locale = language === "hi" ? "hi-IN" : "en-IN";

  const getCategoryLabel = (categoryKey: NewsCategory) => {
    switch (categoryKey) {
      case "weather":
        return t("pages.newsReports.categoryWeatherAlert");
      case "market_update":
        return t("pages.newsReports.categoryMarketUpdate");
      case "technology":
        return t("pages.newsReports.categoryTechnology");
      case "success_story":
        return t("pages.newsReports.categorySuccessStory");
      default:
        return t("pages.newsReports.categoryGovernmentPolicy");
    }
  };

  const handleRefresh = async (manualRefresh = false) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const rawLocation = localStorage.getItem("userLocation");
      const userLocation = safeJsonParse<{ state?: string; district?: string } | null>(rawLocation, null);

      const response = await api.news.getAll({
        language,
        category: selectedCategory as "all" | "weather" | "market_update" | "technology" | "success_story" | "policy",
        priority: selectedPriority as "all" | "critical" | "high" | "medium" | "low",
        state: userLocation?.state,
        district: userLocation?.district,
        limit: 30,
        offset: 0,
        forceRefresh: manualRefresh,
      });

      setNewsItems(Array.isArray(response?.news) ? response.news : []);
      setLastUpdatedAt(response?.meta?.lastUpdatedAt || new Date().toISOString());
      setVisibleNewsCount(6);
    } catch (error) {
      console.error("Failed to load live news feed:", error);
      setErrorMessage(t("pages.newsReports.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void handleRefresh(false);

    const intervalId = window.setInterval(() => {
      void handleRefresh(false);
    }, NEWS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [language, selectedCategory, selectedPriority]);

  const handleLoadMore = () => {
    setVisibleNewsCount(prev => prev + 6);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
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

  const filteredNews = newsItems.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || news.categoryKey === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || news.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const visibleNews = filteredNews.slice(0, visibleNewsCount);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border/70 bg-card/95 p-3 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl mb-8 border border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t("pages.newsReports.title")}
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 px-4">
              {t("pages.newsReports.subtitle")}
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-6 shadow-inner">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 md:w-5 h-4 md:h-5" />
                <Input
                  placeholder={t("pages.newsReports.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 md:h-12 text-base md:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-green-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 h-10 md:h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t("pages.newsReports.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("pages.newsReports.allCategories")}</SelectItem>
                    <SelectItem value="weather">{t("pages.newsReports.categoryWeatherAlert")}</SelectItem>
                    <SelectItem value="market_update">{t("pages.newsReports.categoryMarketUpdate")}</SelectItem>
                    <SelectItem value="technology">{t("pages.newsReports.categoryTechnology")}</SelectItem>
                    <SelectItem value="success_story">{t("pages.newsReports.categorySuccessStory")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-36 h-10 md:h-12">
                    <SelectValue placeholder={t("pages.newsReports.priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("pages.newsReports.all")}</SelectItem>
                    <SelectItem value="critical">{t("pages.newsReports.critical")}</SelectItem>
                    <SelectItem value="high">{t("pages.newsReports.high")}</SelectItem>
                    <SelectItem value="medium">{t("pages.newsReports.medium")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => void handleRefresh(true)} disabled={isLoading} variant="outline" className="h-10 md:h-12 px-4 md:px-6">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t("pages.newsReports.refresh")}</span>
                </Button>
              </div>
            </div>
            {(errorMessage || lastUpdatedAt) && (
              <div className="mt-3 text-sm text-muted-foreground">
                {errorMessage && <p>{errorMessage}</p>}
                {lastUpdatedAt && (
                  <p>
                    {t("pages.newsReports.lastUpdated")} {formatDate(lastUpdatedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              {t("pages.newsReports.latestNews")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {visibleNews.map((news) => (
                <Card key={news.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <div className="relative">
                    {news.image ? (
                      <img
                        src={news.image}
                        alt={news.title}
                        loading="lazy"
                        className="w-full h-40 md:h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 md:h-48 bg-muted flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getPriorityColor(news.priority)} flex items-center gap-1 text-xs`}>
                        {getPriorityIcon(news.priority)}
                        <span className="hidden sm:inline capitalize">{news.priority}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2 md:pb-3 px-4 md:px-6 pt-4">
                    <Badge variant="outline" className="w-fit mb-2 text-xs">{getCategoryLabel(news.categoryKey)}</Badge>
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
                        <span className="sm:hidden">{new Date(news.publishedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3 md:mb-4 min-h-6">
                      {(news.tags || []).slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm"
                      disabled={!news.url}
                      onClick={() => {
                        if (news.url) {
                          window.open(news.url, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      {news.url ? t("pages.newsReports.readMore") : t("pages.newsReports.linkUnavailable")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visibleNews.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <Newspaper className="w-16 md:w-20 h-16 md:h-20 text-gray-400 mx-auto mb-4 md:mb-6" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">{t("pages.newsReports.noNewsFound")}</h3>
                <p className="text-gray-600 dark:text-gray-300 px-4">{t("pages.newsReports.adjustFilters")}</p>
              </div>
            )}

            {visibleNews.length < filteredNews.length && (
              <div className="text-center pt-6 md:pt-8">
                <Button onClick={handleLoadMore} size="lg" className="px-6 md:px-8">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {t("pages.newsReports.loadMoreNews")}
                </Button>
              </div>
            )}
        </section>
      </div>
      </div>
    </div>
  );
};

export default NewsReports;