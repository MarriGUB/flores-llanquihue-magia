import {
  Facebook,
  Instagram,
  Linkedin,
  Link2,
  MessageCircle,
  Music,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
];

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const key = platform?.toLowerCase();

  switch (key) {
    case "instagram":
      return <Instagram className={className} />;
    case "whatsapp":
      return <MessageCircle className={className} />;
    case "tiktok":
      return <Music className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "phone":
      return <Phone className={className} />;
    default:
      return <Link2 className={className} />;
  }
}
