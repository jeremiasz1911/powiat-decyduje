import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Eye,
  FileText,
  Globe,
  Map,
  MessageCircle,
  ThumbsUp,
  User,
  UserPlus,
  Vote,
} from 'lucide-react';

export type LandingScreenshot = {
  id: string;
  /** Path in admin/public, e.g. /landing/screenshot-start.png */
  src: string;
  label: string;
  alt: string;
};

/** TODO: Podmień pliki w admin/public/landing/ na prawdziwe screenshoty aplikacji. */
export const LANDING_SCREENSHOTS: LandingScreenshot[] = [
  {
    id: 'start',
    src: '/landing/screenshot-start.png',
    label: 'Start',
    alt: 'Ekran startowy aplikacji Powiat Decyduje',
  },
  {
    id: 'mapa',
    src: '/landing/screenshot-mapa.png',
    label: 'Mapa',
    alt: 'Mapa projektów w aplikacji Powiat Decyduje',
  },
  {
    id: 'projekty',
    src: '/landing/screenshot-projekty.png',
    label: 'Projekty',
    alt: 'Lista projektów w aplikacji Powiat Decyduje',
  },
  {
    id: 'szczegoly',
    src: '/landing/screenshot-szczegoly.png',
    label: 'Szczegóły',
    alt: 'Szczegóły projektu w aplikacji Powiat Decyduje',
  },
  {
    id: 'profil',
    src: '/landing/screenshot-profil.png',
    label: 'Profil',
    alt: 'Profil mieszkańca w aplikacji Powiat Decyduje',
  },
];

export const HERO_PHONE_SCREENSHOT = '/landing/phone-start.png';

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: Eye,
    title: 'Przeglądanie projektów',
    description: 'Przeglądaj inicjatywy obywatelskie zgłoszone w powiecie — z opisem, statusem i lokalizacją.',
  },
  {
    icon: FileText,
    title: 'Szczegóły projektów',
    description: 'Sprawdź pełne informacje o każdej inicjatywie: opis, koszt, status i liczbę głosów.',
  },
  {
    icon: Map,
    title: 'Mapa projektów',
    description: 'Zobacz, gdzie realizowane są projekty — wszystko na przejrzystej mapie powiatu.',
  },
  {
    icon: Vote,
    title: 'Głosowanie',
    description: 'Oddawaj głosy na wybrane inicjatywy jako zweryfikowany mieszkaniec powiatu.',
  },
  {
    icon: UserPlus,
    title: 'Zgłaszanie pomysłów',
    description: 'Masz własny pomysł? Zgłoś projekt obywatelski bezpośrednio z aplikacji.',
  },
  {
    icon: User,
    title: 'Profil mieszkańca',
    description: 'Zarządzaj danymi konta, preferencjami i profilem mieszkańca w jednym miejscu.',
  },
  {
    icon: ClipboardList,
    title: 'Moje projekty',
    description: 'Śledź status swoich zgłoszeń — także tych oczekujących na akceptację.',
  },
  {
    icon: Globe,
    title: 'Informacje o procedurach',
    description: 'Dowiedz się, jak wygląda proces zgłaszania, weryfikacji i głosowania.',
  },
  {
    icon: MessageCircle,
    title: 'Kontakt i komunikacja',
    description: 'Łatwiejszy dostęp do informacji i kontaktu z samorządem powiatowym.',
  },
  {
    icon: ThumbsUp,
    title: 'Tryb gościa',
    description: 'Przeglądaj mapę i projekty bez logowania — konto potrzebne tylko do głosowania i zgłoszeń.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Przeglądasz projekty i mapę',
    description: 'Bez konta możesz zobaczyć, jakie inicjatywy są realizowane w powiecie.',
  },
  {
    step: 2,
    title: 'Sprawdzasz szczegóły',
    description: 'Czytasz opis, lokalizację, status i koszt wybranego projektu.',
  },
  {
    step: 3,
    title: 'Logujesz się jako mieszkaniec',
    description: 'Aby głosować lub zgłaszać pomysły, wystarczy konto mieszkańca powiatu.',
  },
  {
    step: 4,
    title: 'Głosujesz lub zgłaszasz pomysł',
    description: 'Wspierasz inicjatywy głosem albo proponujesz własny projekt.',
  },
  {
    step: 5,
    title: 'Śledzisz status',
    description: 'W sekcji „Moje projekty” widzisz postęp weryfikacji i realizacji.',
  },
];

export const PROCEDURE_ITEMS = [
  {
    title: 'Zgłoszenie projektu',
    description: 'Mieszkaniec wypełnia formularz z opisem, lokalizacją i zdjęciami — administrator weryfikuje zgłoszenie.',
  },
  {
    title: 'Sprawdzenie statusu',
    description: 'W aplikacji widać, czy projekt czeka na akceptację, jest opublikowany czy odrzucony.',
  },
  {
    title: 'Udział w głosowaniu',
    description: 'Po publikacji projektu mieszkańcy mogą oddawać głosy w ramach ustalonych zasad.',
  },
  {
    title: 'Dostęp do informacji',
    description: 'Wszystkie kluczowe dane — mapa, lista, szczegóły — są dostępne w jednej aplikacji.',
  },
  {
    title: 'Kontakt z samorządem',
    description: 'Aplikacja ułatwia kontakt i orientację w sprawach lokalnych inicjatyw.',
  },
];

export const RESIDENT_BENEFITS = [
  'Wszystko w jednym miejscu — projekty, mapa, głosowanie i informacje.',
  'Szybki dostęp do aktualnych inicjatyw bez szukania po wielu stronach.',
  'Wygodne głosowanie z telefonu — bez papierowych formularzy.',
  'Przejrzyste informacje o statusie i lokalizacji projektów.',
  'Możliwość zgłaszania własnych pomysłów bezpośrednio do samorządu.',
  'Większy wpływ mieszkańców na lokalne decyzje i życie społeczności.',
];

export const FAQ_ITEMS = [
  {
    question: 'Czy mogę korzystać z aplikacji bez konta?',
    answer:
      'Tak. W trybie gościa możesz przeglądać mapę i listę opublikowanych projektów bez logowania.',
  },
  {
    question: 'Kiedy muszę się zalogować?',
    answer:
      'Logowanie jest wymagane przy głosowaniu, zgłaszaniu własnego projektu, edycji profilu i dostępie do „Moje projekty”.',
  },
  {
    question: 'Czy mogę zgłosić własny projekt?',
    answer:
      'Tak. Zalogowany mieszkaniec powiatu może zgłosić inicjatywę przez formularz w aplikacji. Projekt przechodzi weryfikację administratora.',
  },
  {
    question: 'Jak działa głosowanie?',
    answer:
      'Po zalogowaniu możesz oddać głos na wybrane, zaakceptowane projekty. Szczegóły limitu głosów są widoczne w aplikacji.',
  },
  {
    question: 'Czy aplikacja pokazuje projekty na mapie?',
    answer:
      'Tak. Mapa prezentuje lokalizacje opublikowanych projektów na terenie powiatu mławskiego.',
  },
];

/** TODO: Uzupełnij prawdziwe dane kontaktowe powiatu. */
export const CONTACT = {
  email: 'kontakt@powiatmlawski.pl',
  phone: 'Dane kontaktowe do uzupełnienia',
  website: 'https://powiatmlawski.pl',
  websiteLabel: 'Strona Powiatu Mławskiego',
};

/** TODO: Link do App Store / Google Play lub deep link aplikacji mobilnej. */
export const APP_LINKS = {
  openApp: '#',
  appStore: '#',
  googlePlay: '#',
};

export const LANDING_NAV = [
  { href: '#o-aplikacji', label: 'O aplikacji' },
  { href: '#funkcje', label: 'Funkcje' },
  { href: '#procedury', label: 'Procedury' },
  { href: '#kontakt', label: 'Kontakt' },
];
