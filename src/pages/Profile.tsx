import { useState } from "react";
import { User, Mail, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t("pages.profile.nameRequired"),
        description: t("pages.profile.nameRequiredDescription"),
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast({
        title: t("pages.profile.updated"),
        description: t("pages.profile.updatedDescription"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6 text-primary" />
            {t("dashboard.profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-name">{t("pages.profile.name")}</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.profile.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">{t("pages.profile.email")}</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-email"
                value={user?.email || ""}
                disabled
                className="pl-9"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("pages.profile.saving") : t("pages.profile.saveChanges")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
