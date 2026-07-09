/**
 * Treści prawne są szablonem i powinny zostać zweryfikowane
 * przez administratora danych lub prawnika przed publikacją.
 */

export type LegalLang = 'pl' | 'en';

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'link'; href: string; label: string; before?: string; after?: string };

export type LegalPageContent = {
  title: string;
  metaDescription: string;
  lastUpdated: string;
  blocks: LegalBlock[];
};

export type LegalPageId = 'privacy' | 'terms' | 'support' | 'account-deletion' | 'safety-standards';

export const SAFETY_STANDARDS_LAST_UPDATED = {
  pl: '10 lipca 2026',
  en: '10 July 2026',
};

export const LEGAL_FOOTER_LINKS: { href: string; labelPl: string; labelEn: string }[] = [
  { href: '/privacy', labelPl: 'Polityka prywatności', labelEn: 'Privacy Policy' },
  { href: '/terms', labelPl: 'Regulamin', labelEn: 'Terms of Use' },
  { href: '/support', labelPl: 'Wsparcie', labelEn: 'Support' },
  { href: '/account-deletion', labelPl: 'Usuwanie konta', labelEn: 'Account Deletion' },
  { href: '/standardy', labelPl: 'Standardy bezpieczeństwa', labelEn: 'Child Safety Standards' },
];

/** TODO: Zweryfikuj treści prawne przed publikacją. */
export const LEGAL_CONTACT = {
  controllerName: 'Jeremiasz Wiśniewski',
  address: '06-500 Mława, Polska',
  email: 'kontakt@powiatdecyduje.pl',
  phone: 'do uzupełnienia', // TODO: uzupełnij numer telefonu
  dpoEmail: 'nie dotyczy / nie został wyznaczony',
  lastUpdated: 'TODO: wpisz datę', // TODO: ustaw datę ostatniej aktualizacji
};

export const LEGAL_PAGES: Record<LegalLang, Record<LegalPageId, LegalPageContent>> = {
  pl: {
    privacy: {
      title: 'Polityka prywatności — Powiat Decyduje',
      metaDescription:
        'Polityka prywatności aplikacji Powiat Decyduje. Informacje o przetwarzaniu danych osobowych, celach, podstawach prawnych, czasie przechowywania danych i prawach użytkownika.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Polityka prywatności aplikacji „Powiat Decyduje”' },
        { type: 'p', text: `Data ostatniej aktualizacji: ${LEGAL_CONTACT.lastUpdated}` },
        {
          type: 'p',
          text: 'Niniejsza Polityka prywatności wyjaśnia, w jaki sposób aplikacja „Powiat Decyduje” przetwarza dane użytkowników. Aplikacja jest przeznaczona dla mieszkańców Powiatu Mławskiego w województwie mazowieckim i służy do przeglądania projektów, mapy inicjatyw, informacji o procedurach, głosowania oraz zgłaszania pomysłów.',
        },
        { type: 'h2', text: '1. Administrator danych' },
        { type: 'p', text: 'Administratorem danych osobowych użytkowników aplikacji „Powiat Decyduje” jest:' },
        { type: 'p', text: LEGAL_CONTACT.controllerName },
        { type: 'p', text: '06-500 Mława' },
        { type: 'p', text: 'Polska' },
        { type: 'link', before: 'E-mail kontaktowy: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'p', text: `Telefon: ${LEGAL_CONTACT.phone}` },
        {
          type: 'p',
          text: 'Aplikacja jest projektem wspierającym udział mieszkańców Powiatu Mławskiego w lokalnych decyzjach i może być rozwijana lub promowana we współpracy z Powiatem Mławskim oraz Starostwem Powiatowym w Mławie.',
        },
        {
          type: 'p',
          text: 'Administratorem danych osobowych użytkowników aplikacji, o ile odrębne dokumenty lub procedury nie stanowią inaczej, jest Jeremiasz Wiśniewski.',
        },
        { type: 'p', text: 'Inspektor Ochrony Danych nie został wyznaczony.' },
        {
          type: 'link',
          before: 'W sprawach dotyczących ochrony danych osobowych można kontaktować się pod adresem: ',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: 'Współpraca z Powiatem Mławskim' },
        {
          type: 'p',
          text: 'Aplikacja „Powiat Decyduje” jest związana tematycznie z obszarem Powiatu Mławskiego i może być wykorzystywana do prezentowania informacji o lokalnych projektach, inicjatywach, procedurach oraz głosowaniach.',
        },
        {
          type: 'p',
          text: 'Aplikacja może być rozwijana, promowana lub wykorzystywana we współpracy z Powiatem Mławskim oraz Starostwem Powiatowym w Mławie. Taka współpraca nie oznacza automatycznie zmiany administratora danych osobowych, chyba że wynika to z odrębnych dokumentów, regulaminów, uchwał lub procedur.',
        },
        { type: 'h2', text: '2. Jakie dane możemy przetwarzać' },
        {
          type: 'p',
          text: 'W zależności od sposobu korzystania z aplikacji możemy przetwarzać następujące dane:',
        },
        {
          type: 'ul',
          items: [
            'numer telefonu,',
            'adres e-mail, jeżeli jest używany w procesie logowania lub kontaktu,',
            'identyfikator użytkownika w systemie,',
            'dane profilu mieszkańca,',
            'informacje potrzebne do weryfikacji uprawnienia do korzystania z funkcji mieszkańca,',
            'treść zgłoszonych projektów lub pomysłów,',
            'informacje o oddanych głosach, jeżeli funkcja głosowania jest aktywna,',
            'dane techniczne potrzebne do działania aplikacji, takie jak identyfikatory techniczne, logi błędów, informacje diagnostyczne i podstawowe dane o urządzeniu.',
          ],
        },
        {
          type: 'p',
          text: 'Aplikacja może umożliwiać korzystanie w trybie gościa. W trybie gościa użytkownik może przeglądać publiczne treści bez zakładania konta. Logowanie może być wymagane dla funkcji takich jak głosowanie, zgłoszenie projektu, profil mieszkańca lub moje projekty.',
        },
        { type: 'h2', text: '3. Cele przetwarzania danych' },
        { type: 'p', text: 'Dane są przetwarzane wyłącznie w celach związanych z działaniem aplikacji, w szczególności:' },
        {
          type: 'ul',
          items: [
            'utworzenie i obsługa konta użytkownika,',
            'umożliwienie logowania i weryfikacji użytkownika,',
            'udostępnienie funkcji profilu mieszkańca,',
            'umożliwienie przeglądania i zgłaszania projektów,',
            'umożliwienie udziału w głosowaniach,',
            'obsługa mapy projektów i informacji o inicjatywach,',
            'obsługa kontaktu z użytkownikiem,',
            'zapewnienie bezpieczeństwa aplikacji,',
            'diagnozowanie błędów i poprawa działania aplikacji,',
            'spełnienie obowiązków prawnych, jeżeli mają zastosowanie.',
          ],
        },
        {
          type: 'p',
          text: 'Dane nie są wykorzystywane do sprzedaży użytkownikom reklam ani do śledzenia użytkownika pomiędzy różnymi aplikacjami lub stronami internetowymi.',
        },
        { type: 'h2', text: '4. Podstawy prawne przetwarzania' },
        { type: 'p', text: 'Dane mogą być przetwarzane na podstawie:' },
        {
          type: 'ul',
          items: [
            'art. 6 ust. 1 lit. a RODO — zgoda użytkownika, jeżeli jest wymagana,',
            'art. 6 ust. 1 lit. b RODO — wykonanie usługi dostępnej w aplikacji,',
            'art. 6 ust. 1 lit. c RODO — obowiązek prawny ciążący na administratorze,',
            'art. 6 ust. 1 lit. e RODO — wykonanie zadania realizowanego w interesie publicznym, jeżeli ma zastosowanie,',
            'art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes administratora, np. zapewnienie bezpieczeństwa, obsługa błędów i ochrona przed nadużyciami, jeżeli ma zastosowanie.',
          ],
        },
        {
          type: 'p',
          text: 'TODO: dopasuj podstawy prawne do faktycznego administratora i celu działania aplikacji. Jeżeli administratorem będzie jednostka publiczna, sprawdź szczególnie podstawę art. 6 ust. 1 lit. e RODO.',
        },
        { type: 'h2', text: '5. Dostawcy usług technicznych' },
        { type: 'p', text: 'Do działania aplikacji mogą być wykorzystywane usługi techniczne, w szczególności:' },
        {
          type: 'ul',
          items: [
            'Firebase / Google Cloud — obsługa logowania, bazy danych, funkcji serwerowych, przechowywania danych i diagnostyki,',
            'dostawca SMS — wysyłka kodów weryfikacyjnych,',
            'usługi hostingowe używane do działania strony internetowej i aplikacji.',
          ],
        },
        {
          type: 'p',
          text: 'Podmioty te mogą przetwarzać dane wyłącznie w zakresie niezbędnym do świadczenia usług technicznych dla aplikacji.',
        },
        { type: 'h2', text: '6. Przekazywanie danych poza Europejski Obszar Gospodarczy' },
        {
          type: 'p',
          text: 'Niektóre usługi techniczne, np. dostawcy infrastruktury chmurowej, mogą wiązać się z przetwarzaniem danych poza Europejskim Obszarem Gospodarczym. W takim przypadku przekazywanie danych odbywa się z zastosowaniem odpowiednich zabezpieczeń wymaganych przez przepisy RODO, takich jak standardowe klauzule umowne lub inne mechanizmy przewidziane prawem.',
        },
        {
          type: 'p',
          text: 'TODO: sprawdź i dopasuj ten fragment do faktycznych dostawców usług używanych w projekcie.',
        },
        { type: 'h2', text: '7. Czas przechowywania danych' },
        {
          type: 'p',
          text: 'Dane są przechowywane wyłącznie tak długo, jak jest to potrzebne do realizacji celów, dla których zostały zebrane, w szczególności:',
        },
        {
          type: 'ul',
          items: [
            'przez czas korzystania z konta użytkownika,',
            'przez czas potrzebny do obsługi projektów, głosowań lub procedur,',
            'przez okres wymagany przepisami prawa,',
            'przez okres potrzebny do zabezpieczenia ewentualnych roszczeń,',
            'przez okres potrzebny do wykrywania nadużyć i zapewnienia bezpieczeństwa aplikacji.',
          ],
        },
        {
          type: 'p',
          text: 'Po ustaniu potrzeby przetwarzania dane są usuwane albo anonimizowane, o ile przepisy prawa nie wymagają ich dalszego przechowywania.',
        },
        { type: 'p', text: 'TODO: jeżeli istnieją konkretne okresy retencji danych, wpisz je tutaj.' },
        { type: 'h2', text: '8. Prawa użytkownika' },
        { type: 'p', text: 'Użytkownik ma prawo do:' },
        {
          type: 'ul',
          items: [
            'dostępu do swoich danych,',
            'sprostowania danych,',
            'usunięcia danych,',
            'ograniczenia przetwarzania,',
            'przenoszenia danych, jeżeli ma zastosowanie,',
            'wniesienia sprzeciwu wobec przetwarzania,',
            'cofnięcia zgody, jeżeli przetwarzanie odbywa się na podstawie zgody,',
            'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
          ],
        },
        {
          type: 'link',
          before: 'W sprawach dotyczących danych osobowych można skontaktować się z administratorem pod adresem: ',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: '9. Usuwanie konta' },
        {
          type: 'p',
          text: 'Użytkownik może poprosić o usunięcie konta i danych powiązanych z kontem, kontaktując się z administratorem:',
        },
        { type: 'link', before: 'E-mail: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'link', before: 'Szczegóły: ', href: '/account-deletion', label: 'Usuwanie konta', after: '.' },
        { type: 'h2', text: '10. Bezpieczeństwo danych' },
        {
          type: 'p',
          text: 'Stosujemy środki techniczne i organizacyjne mające na celu ochronę danych przed nieuprawnionym dostępem, utratą, zmianą lub nieuprawnionym ujawnieniem. Dostęp do danych powinien być ograniczony do osób i podmiotów, dla których jest to niezbędne do działania aplikacji.',
        },
        { type: 'h2', text: '11. Zmiany Polityki prywatności' },
        {
          type: 'p',
          text: 'Polityka prywatności może być aktualizowana, jeżeli zmieni się sposób działania aplikacji, zakres przetwarzanych danych, przepisy prawa lub wykorzystywane usługi techniczne. Aktualna wersja Polityki prywatności będzie dostępna na tej stronie.',
        },
      ],
    },
    terms: {
      title: 'Regulamin — Powiat Decyduje',
      metaDescription: 'Regulamin korzystania z aplikacji Powiat Decyduje.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Regulamin aplikacji „Powiat Decyduje”' },
        { type: 'p', text: `Data ostatniej aktualizacji: ${LEGAL_CONTACT.lastUpdated}` },
        { type: 'h2', text: '1. Postanowienia ogólne' },
        {
          type: 'p',
          text: 'Niniejszy Regulamin określa zasady korzystania z aplikacji „Powiat Decyduje”, przeznaczonej dla mieszkańców Powiatu Mławskiego w województwie mazowieckim.',
        },
        {
          type: 'p',
          text: 'Aplikacja „Powiat Decyduje” jest prowadzona przez Jeremiasza Wiśniewskiego i może być rozwijana lub promowana we współpracy z Powiatem Mławskim oraz Starostwem Powiatowym w Mławie.',
        },
        { type: 'p', text: 'Dane operatora aplikacji:' },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'p', text: 'ul. Południowa 21B/1' },
        { type: 'p', text: '06-450 Glinojeck' },
        { type: 'p', text: 'Polska' },
        { type: 'link', before: 'E-mail: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        {
          type: 'p',
          text: 'Aplikacja umożliwia między innymi przeglądanie projektów, mapy inicjatyw, informacji o procedurach, korzystanie z trybu gościa, a po zalogowaniu również korzystanie z funkcji dostępnych dla mieszkańców.',
        },
        { type: 'h2', text: '2. Korzystanie z aplikacji' },
        { type: 'p', text: 'Użytkownik może korzystać z części funkcji aplikacji bez logowania, w trybie gościa.' },
        { type: 'p', text: 'Logowanie może być wymagane do funkcji takich jak:' },
        {
          type: 'ul',
          items: [
            'głosowanie,',
            'zgłoszenie projektu,',
            'dostęp do profilu mieszkańca,',
            'przeglądanie własnych projektów,',
            'inne funkcje wymagające identyfikacji użytkownika.',
          ],
        },
        { type: 'h2', text: '3. Konto użytkownika' },
        {
          type: 'p',
          text: 'Użytkownik zobowiązuje się podawać prawdziwe i aktualne dane, jeżeli są one wymagane do korzystania z funkcji aplikacji.',
        },
        {
          type: 'p',
          text: 'Użytkownik powinien chronić dane dostępowe do konta i nie udostępniać ich innym osobom.',
        },
        { type: 'h2', text: '4. Zasady korzystania' },
        {
          type: 'p',
          text: 'Użytkownik zobowiązuje się korzystać z aplikacji zgodnie z prawem, dobrymi obyczajami i przeznaczeniem aplikacji.',
        },
        { type: 'p', text: 'Zabronione jest w szczególności:' },
        {
          type: 'ul',
          items: [
            'podawanie nieprawdziwych danych,',
            'podszywanie się pod inne osoby,',
            'zgłaszanie treści bezprawnych, obraźliwych lub naruszających prawa innych osób,',
            'zakłócanie działania aplikacji,',
            'próby uzyskania nieuprawnionego dostępu do danych lub systemów.',
          ],
        },
        { type: 'h2', text: '5. Projekty i treści użytkowników' },
        {
          type: 'p',
          text: 'Jeżeli aplikacja umożliwia zgłaszanie projektów, pomysłów, opisów lub innych treści, użytkownik odpowiada za treści, które przekazuje.',
        },
        {
          type: 'p',
          text: 'Administrator może odmówić publikacji lub usunąć treści, które naruszają prawo, Regulamin, prawa innych osób albo zasady działania aplikacji.',
        },
        { type: 'h2', text: '6. Głosowanie' },
        {
          type: 'p',
          text: 'Jeżeli aplikacja umożliwia głosowanie, użytkownik powinien korzystać z tej funkcji zgodnie z zasadami danej procedury.',
        },
        {
          type: 'p',
          text: 'Szczegółowe zasady głosowania, terminy i kryteria mogą być określone w osobnych dokumentach, uchwałach, regulaminach lub komunikatach organizatora.',
        },
        { type: 'h2', text: '7. Dostępność aplikacji' },
        {
          type: 'p',
          text: 'Administrator dokłada starań, aby aplikacja działała prawidłowo, ale nie gwarantuje nieprzerwanej dostępności wszystkich funkcji.',
        },
        {
          type: 'p',
          text: 'Aplikacja może być czasowo niedostępna z powodu prac technicznych, aktualizacji, awarii lub przyczyn niezależnych od administratora.',
        },
        { type: 'h2', text: '8. Odpowiedzialność' },
        {
          type: 'p',
          text: 'Aplikacja ma charakter informacyjny i użytkowy. Informacje prezentowane w aplikacji powinny być zgodne z danymi administratora, ale w razie wątpliwości wiążące mogą być oficjalne dokumenty, uchwały, regulaminy lub komunikaty właściwych organów.',
        },
        { type: 'h2', text: '9. Prywatność' },
        { type: 'link', before: 'Zasady przetwarzania danych osobowych opisuje ', href: '/privacy', label: 'Polityka prywatności', after: '.' },
        { type: 'h2', text: '10. Kontakt' },
        { type: 'p', text: 'W sprawach dotyczących działania aplikacji można skontaktować się z administratorem:' },
        { type: 'p', text: `E-mail: ${LEGAL_CONTACT.email}` },
        { type: 'p', text: `Telefon: ${LEGAL_CONTACT.phone}` },
        { type: 'p', text: `Adres: ${LEGAL_CONTACT.address}` },
        { type: 'h2', text: '11. Zmiany Regulaminu' },
        {
          type: 'p',
          text: 'Regulamin może być aktualizowany, jeżeli zmieni się sposób działania aplikacji, zakres funkcji, przepisy prawa lub procedury związane z projektami i głosowaniem.',
        },
      ],
    },
    support: {
      title: 'Wsparcie — Powiat Decyduje',
      metaDescription: 'Wsparcie techniczne i kontakt w sprawie aplikacji Powiat Decyduje.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Powiat Decyduje — wsparcie' },
        {
          type: 'p',
          text: 'Powiat Decyduje to aplikacja dla mieszkańców Powiatu Mławskiego w województwie mazowieckim.',
        },
        {
          type: 'p',
          text: 'Aplikacja może być rozwijana lub promowana we współpracy z Powiatem Mławskim oraz Starostwem Powiatowym w Mławie.',
        },
        {
          type: 'p',
          text: 'W przypadku problemów z aplikacją, pytań dotyczących jej działania albo uwag technicznych prosimy o kontakt:',
        },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'p', text: '06-500 Mława' },
        { type: 'p', text: 'Polska' },
        { type: 'link', before: 'E-mail: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'p', text: `Telefon: ${LEGAL_CONTACT.phone}` },
        { type: 'p', text: 'Aplikacja: Powiat Decyduje' },
        { type: 'p', text: 'Obszar działania: Powiat Mławski, województwo mazowieckie, Polska' },
        { type: 'p', text: 'Przed kontaktem warto podać:' },
        {
          type: 'ul',
          items: [
            'model telefonu,',
            'system operacyjny,',
            'opis problemu,',
            'zrzut ekranu, jeżeli może pomóc w rozwiązaniu problemu.',
          ],
        },
      ],
    },
    'account-deletion': {
      title: 'Usuwanie konta — Powiat Decyduje',
      metaDescription: 'Informacje o usuwaniu konta w aplikacji Powiat Decyduje.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Usuwanie konta' },
        {
          type: 'p',
          text: 'Użytkownik aplikacji „Powiat Decyduje” może poprosić o usunięcie konta oraz danych powiązanych z kontem.',
        },
        { type: 'p', text: 'Aby zgłosić prośbę o usunięcie konta, skontaktuj się z administratorem danych:' },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'link', before: 'E-mail: ', href: 'mailto:kontakt@powiatmlawski.pl', label: 'kontakt@powiatmlawski.pl' },
        { type: 'p', text: 'Temat wiadomości: Usunięcie konta — Powiat Decyduje' },
        {
          type: 'p',
          text: 'W wiadomości podaj numer telefonu lub adres e-mail używany w aplikacji, aby umożliwić identyfikację konta.',
        },
        {
          type: 'p',
          text: 'Po otrzymaniu zgłoszenia administrator może poprosić o dodatkowe potwierdzenie tożsamości, aby zapobiec usunięciu konta przez osobę nieuprawnioną.',
        },
        {
          type: 'p',
          text: 'Dane zostaną usunięte albo zanonimizowane, o ile przepisy prawa nie wymagają ich dalszego przechowywania.',
        },
        { type: 'link', before: 'Więcej informacji: ', href: '/privacy', label: 'Polityka prywatności', after: '.' },
      ],
    },
    'safety-standards': {
      title: 'Standardy bezpieczeństwa dzieci i przeciwdziałania CSAE',
      metaDescription:
        'Standardy bezpieczeństwa dzieci i przeciwdziałania CSAE w aplikacji Powiat Decyduje.',
      lastUpdated: SAFETY_STANDARDS_LAST_UPDATED.pl,
      blocks: [
        {
          type: 'p',
          text: 'Aplikacja Powiat Decyduje nie toleruje żadnych treści, zachowań ani działań związanych z wykorzystywaniem seksualnym dzieci, krzywdzeniem dzieci lub materiałami przedstawiającymi seksualne wykorzystywanie dzieci.',
        },
        {
          type: 'p',
          text: 'Zakazane jest tworzenie, przesyłanie, publikowanie, zgłaszanie lub rozpowszechnianie jakichkolwiek treści, które mogą:',
        },
        {
          type: 'ul',
          items: [
            'przedstawiać lub promować seksualne wykorzystywanie dzieci,',
            'ułatwiać kontakt z dzieckiem w celu wykorzystania lub krzywdzenia,',
            'zawierać materiały CSAM, czyli materiały przedstawiające seksualne wykorzystywanie dzieci,',
            'naruszać bezpieczeństwo dzieci lub obowiązujące przepisy prawa.',
          ],
        },
        {
          type: 'p',
          text: 'Powiat Decyduje jest aplikacją służącą do przeglądania projektów lokalnych, mapy inicjatyw oraz udziału mieszkańców w działaniach społecznych. Aplikacja nie służy do randkowania, prywatnej komunikacji z dziećmi ani publikowania treści o charakterze seksualnym.',
        },
        { type: 'h2', text: 'Zgłaszanie naruszeń' },
        {
          type: 'p',
          text: 'Użytkownicy mogą zgłaszać naruszenia, niepokojące treści lub problemy dotyczące bezpieczeństwa poprzez kontakt z administratorem aplikacji.',
        },
        { type: 'p', text: 'Adres kontaktowy:' },
        {
          type: 'link',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        {
          type: 'p',
          text: 'W przypadku zgłoszenia dotyczącego bezpieczeństwa dzieci lub podejrzenia CSAE/CSAM administrator podejmie odpowiednie działania, w tym analizę zgłoszenia, usunięcie niedozwolonych treści, zablokowanie konta lub przekazanie sprawy odpowiednim organom, jeśli wymagają tego przepisy prawa.',
        },
        { type: 'h2', text: 'Punkt kontaktowy ds. bezpieczeństwa dzieci' },
        {
          type: 'p',
          text: 'Osoba odpowiedzialna za kontakt w sprawach bezpieczeństwa dzieci i zgłoszeń CSAE:',
        },
        { type: 'p', text: 'Powiat Decyduje' },
        {
          type: 'link',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: 'Współpraca z organami i zgodność z prawem' },
        {
          type: 'p',
          text: 'Powiat Decyduje przestrzega obowiązujących przepisów dotyczących ochrony dzieci oraz przeciwdziałania wykorzystywaniu seksualnemu dzieci. W przypadku uzyskania wiedzy o materiałach CSAM lub działaniach zagrażających dzieciom administrator podejmie odpowiednie działania zgodnie z prawem.',
        },
        { type: 'p', text: `Data ostatniej aktualizacji: ${SAFETY_STANDARDS_LAST_UPDATED.pl}` },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy — Powiat Decyduje',
      metaDescription:
        'Privacy Policy for the Powiat Decyduje app. Information about personal data processing, purposes, legal bases, retention and user rights.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Privacy Policy for “Powiat Decyduje”' },
        { type: 'p', text: `Last updated: ${LEGAL_CONTACT.lastUpdated}` },
        {
          type: 'p',
          text: 'This Privacy Policy explains how the “Powiat Decyduje” app processes user data. The app is intended for residents of Mława County, Masovian Voivodeship, Poland. It allows users to browse projects, view initiatives on a map, access procedure information, vote and submit ideas.',
        },
        { type: 'h2', text: '1. Data Controller' },
        { type: 'p', text: 'The data controller for users of the “Powiat Decyduje” app is:' },
        { type: 'p', text: LEGAL_CONTACT.controllerName },
        { type: 'p', text: '06-500 Mława' },
        { type: 'p', text: 'Poland' },
        { type: 'link', before: 'Contact email: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'p', text: 'Phone: to be completed' },
        {
          type: 'p',
          text: 'The app supports resident participation in local decision-making in Mława County and may be developed or promoted in cooperation with Mława County and the District Office in Mława.',
        },
        {
          type: 'p',
          text: 'Unless separate documents or procedures state otherwise, the data controller for app users’ personal data is Jeremiasz Wiśniewski.',
        },
        { type: 'p', text: 'A Data Protection Officer has not been appointed.' },
        {
          type: 'link',
          before: 'For personal data matters, users may contact: ',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: 'Cooperation with Mława County' },
        {
          type: 'p',
          text: 'The “Powiat Decyduje” app is related to the area of Mława County and may be used to present information about local projects, initiatives, procedures and voting.',
        },
        {
          type: 'p',
          text: 'The app may be developed, promoted or used in cooperation with Mława County and the District Office in Mława. Such cooperation does not automatically change the data controller unless this results from separate documents, terms, resolutions or procedures.',
        },
        { type: 'h2', text: '2. Data We May Process' },
        { type: 'p', text: 'Depending on how the app is used, we may process the following data:' },
        {
          type: 'ul',
          items: [
            'phone number,',
            'email address, if used for sign-in or contact,',
            'user identifier,',
            'resident profile data,',
            'information needed to verify access to resident-only features,',
            'content of submitted projects or ideas,',
            'voting information, if voting is enabled,',
            'technical data required for the operation of the app, such as technical identifiers, error logs, diagnostic information and basic device data.',
          ],
        },
        {
          type: 'p',
          text: 'The app may allow guest access. Guest users can browse public content without creating an account. Signing in may be required for features such as voting, submitting projects, resident profile or user-specific projects.',
        },
        { type: 'h2', text: '3. Purposes of Processing' },
        { type: 'p', text: 'Data is processed only for purposes related to the operation of the app, in particular:' },
        {
          type: 'ul',
          items: [
            'creating and managing a user account,',
            'enabling sign-in and user verification,',
            'providing resident profile features,',
            'enabling users to browse and submit projects,',
            'enabling voting,',
            'displaying project maps and initiative information,',
            'handling user contact,',
            'ensuring app security,',
            'diagnosing errors and improving app performance,',
            'complying with legal obligations, where applicable.',
          ],
        },
        {
          type: 'p',
          text: 'Data is not used to sell advertising to users or to track users across other apps or websites.',
        },
        { type: 'h2', text: '4. Legal Bases for Processing' },
        { type: 'p', text: 'Data may be processed based on:' },
        {
          type: 'ul',
          items: [
            'Article 6(1)(a) GDPR — user consent, where required,',
            'Article 6(1)(b) GDPR — performance of a service available in the app,',
            'Article 6(1)(c) GDPR — compliance with a legal obligation,',
            'Article 6(1)(e) GDPR — performance of a task carried out in the public interest, where applicable,',
            'Article 6(1)(f) GDPR — legitimate interest, such as app security, error handling and protection against abuse, where applicable.',
          ],
        },
        {
          type: 'p',
          text: 'TODO: adjust the legal bases to the actual data controller and purpose of the app. If the controller is a public authority, verify especially Article 6(1)(e) GDPR.',
        },
        { type: 'h2', text: '5. Technical Service Providers' },
        { type: 'p', text: 'The app may use technical service providers, in particular:' },
        {
          type: 'ul',
          items: [
            'Firebase / Google Cloud — authentication, database, server functions, data storage and diagnostics,',
            'SMS provider — sending verification codes,',
            'hosting services used for the website and app infrastructure.',
          ],
        },
        {
          type: 'p',
          text: 'These providers may process data only to the extent necessary to provide technical services for the app.',
        },
        { type: 'h2', text: '6. Transfers Outside the European Economic Area' },
        {
          type: 'p',
          text: 'Some technical services, such as cloud infrastructure providers, may involve processing data outside the European Economic Area. In such cases, data transfers are carried out using appropriate safeguards required by GDPR, such as standard contractual clauses or other legally recognized mechanisms.',
        },
        { type: 'p', text: 'TODO: verify and adjust this section to the actual providers used in the project.' },
        { type: 'h2', text: '7. Data Retention' },
        {
          type: 'p',
          text: 'Data is stored only for as long as necessary for the purposes for which it was collected, in particular:',
        },
        {
          type: 'ul',
          items: [
            'while the user account is active,',
            'for the time needed to handle projects, voting or procedures,',
            'for the period required by law,',
            'for the time necessary to secure potential claims,',
            'for the time needed to detect abuse and ensure app security.',
          ],
        },
        {
          type: 'p',
          text: 'When data is no longer needed, it is deleted or anonymized, unless the law requires further retention.',
        },
        { type: 'p', text: 'TODO: enter specific retention periods if they exist.' },
        { type: 'h2', text: '8. User Rights' },
        { type: 'p', text: 'Users have the right to:' },
        {
          type: 'ul',
          items: [
            'access their data,',
            'correct their data,',
            'delete their data,',
            'restrict processing,',
            'data portability, where applicable,',
            'object to processing,',
            'withdraw consent, where processing is based on consent,',
            'lodge a complaint with the Polish Data Protection Authority.',
          ],
        },
        {
          type: 'link',
          before: 'For personal data matters, users can contact the controller at: ',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: '9. Account Deletion' },
        {
          type: 'p',
          text: 'Users may request deletion of their account and data associated with the account by contacting the controller:',
        },
        { type: 'link', before: 'Email: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'link', before: 'Details: ', href: '/account-deletion', label: 'Account Deletion', after: '.' },
        { type: 'h2', text: '10. Data Security' },
        {
          type: 'p',
          text: 'We use technical and organizational measures designed to protect data against unauthorized access, loss, alteration or disclosure. Access to data should be limited to persons and entities for whom it is necessary for the operation of the app.',
        },
        { type: 'h2', text: '11. Changes to This Privacy Policy' },
        {
          type: 'p',
          text: 'This Privacy Policy may be updated if the app functionality, scope of processed data, legal requirements or technical services change. The current version of the Privacy Policy will be available on this page.',
        },
      ],
    },
    terms: {
      title: 'Terms of Use — Powiat Decyduje',
      metaDescription: 'Terms of Use for the Powiat Decyduje app.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Terms of Use for “Powiat Decyduje”' },
        { type: 'p', text: `Last updated: ${LEGAL_CONTACT.lastUpdated}` },
        { type: 'h2', text: '1. General Provisions' },
        {
          type: 'p',
          text: 'These Terms of Use define the rules for using the “Powiat Decyduje” app, intended for residents of Mława County, Masovian Voivodeship, Poland.',
        },
        {
          type: 'p',
          text: 'The “Powiat Decyduje” app is operated by Jeremiasz Wiśniewski and may be developed or promoted in cooperation with Mława County and the District Office in Mława.',
        },
        { type: 'p', text: 'App operator details:' },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'p', text: 'ul. Południowa 21B/1' },
        { type: 'p', text: '06-450 Glinojeck' },
        { type: 'p', text: 'Poland' },
        { type: 'link', before: 'Email: ', href: 'mailto:kontakt@powiatmlawski.pl', label: 'kontakt@powiatmlawski.pl' },
        {
          type: 'p',
          text: 'The app allows users to browse projects, view initiatives on a map, access procedure information, use guest mode and, after signing in, use resident-only features.',
        },
        { type: 'h2', text: '2. Use of the App' },
        { type: 'p', text: 'Users may access some features of the app without signing in, in guest mode.' },
        { type: 'p', text: 'Signing in may be required for features such as:' },
        {
          type: 'ul',
          items: [
            'voting,',
            'submitting a project,',
            'accessing the resident profile,',
            'viewing user-specific projects,',
            'other features requiring user identification.',
          ],
        },
        { type: 'h2', text: '3. User Account' },
        {
          type: 'p',
          text: 'Users agree to provide true and up-to-date information where required to use the app’s features.',
        },
        { type: 'p', text: 'Users should protect their account access data and not share it with other persons.' },
        { type: 'h2', text: '4. Rules of Use' },
        {
          type: 'p',
          text: 'Users agree to use the app in accordance with the law, good practices and the intended purpose of the app.',
        },
        { type: 'p', text: 'In particular, it is prohibited to:' },
        {
          type: 'ul',
          items: [
            'provide false data,',
            'impersonate other persons,',
            'submit unlawful, offensive or rights-infringing content,',
            'disrupt the operation of the app,',
            'attempt to gain unauthorized access to data or systems.',
          ],
        },
        { type: 'h2', text: '5. Projects and User Content' },
        {
          type: 'p',
          text: 'If the app allows users to submit projects, ideas, descriptions or other content, users are responsible for the content they provide.',
        },
        {
          type: 'p',
          text: 'The administrator may refuse to publish or may remove content that violates the law, these Terms, the rights of others or the rules of the app.',
        },
        { type: 'h2', text: '6. Voting' },
        {
          type: 'p',
          text: 'If the app allows voting, users should use this feature in accordance with the rules of the given procedure.',
        },
        {
          type: 'p',
          text: 'Detailed voting rules, dates and criteria may be set out in separate documents, resolutions, regulations or official announcements.',
        },
        { type: 'h2', text: '7. Availability of the App' },
        {
          type: 'p',
          text: 'The administrator makes efforts to ensure that the app works properly, but does not guarantee uninterrupted availability of all features.',
        },
        {
          type: 'p',
          text: 'The app may be temporarily unavailable due to maintenance, updates, failures or reasons beyond the administrator’s control.',
        },
        { type: 'h2', text: '8. Liability' },
        {
          type: 'p',
          text: 'The app is informational and functional in nature. Information presented in the app should be consistent with the administrator’s data, but in case of doubt, official documents, resolutions, regulations or announcements of the competent authorities may be binding.',
        },
        { type: 'h2', text: '9. Privacy' },
        { type: 'link', before: 'Rules for processing personal data are described in the ', href: '/privacy', label: 'Privacy Policy', after: '.' },
        { type: 'h2', text: '10. Contact' },
        { type: 'p', text: 'For matters related to the operation of the app, users may contact the administrator:' },
        { type: 'p', text: `Email: ${LEGAL_CONTACT.email}` },
        { type: 'p', text: `Phone: ${LEGAL_CONTACT.phone}` },
        { type: 'p', text: `Address: ${LEGAL_CONTACT.address}` },
        { type: 'h2', text: '11. Changes to the Terms' },
        {
          type: 'p',
          text: 'These Terms may be updated if the app functionality, legal requirements or procedures related to projects and voting change.',
        },
      ],
    },
    support: {
      title: 'Support — Powiat Decyduje',
      metaDescription: 'Technical support and contact for the Powiat Decyduje app.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Powiat Decyduje — Support' },
        {
          type: 'p',
          text: 'Powiat Decyduje is an app for residents of Mława County, Masovian Voivodeship, Poland.',
        },
        {
          type: 'p',
          text: 'The app may be developed or promoted in cooperation with Mława County and the District Office in Mława.',
        },
        {
          type: 'p',
          text: 'If you experience any issues with the app, have questions about how it works or want to report a technical problem, please contact us:',
        },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'p', text: '06-500 Mława' },
        { type: 'p', text: 'Poland' },
        { type: 'link', before: 'Email: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'p', text: 'Phone: to be completed' },
        { type: 'p', text: 'App: Powiat Decyduje' },
        { type: 'p', text: 'Area: Mława County, Masovian Voivodeship, Poland' },
        { type: 'p', text: 'When contacting support, please include:' },
        {
          type: 'ul',
          items: [
            'phone model,',
            'operating system,',
            'description of the problem,',
            'screenshot, if it may help resolve the issue.',
          ],
        },
      ],
    },
    'account-deletion': {
      title: 'Account Deletion — Powiat Decyduje',
      metaDescription: 'How to request account deletion in the Powiat Decyduje app.',
      lastUpdated: LEGAL_CONTACT.lastUpdated,
      blocks: [
        { type: 'h2', text: 'Account Deletion' },
        {
          type: 'p',
          text: 'A user of the “Powiat Decyduje” app may request deletion of their account and data associated with the account.',
        },
        { type: 'p', text: 'To request account deletion, please contact the data controller:' },
        { type: 'p', text: 'Jeremiasz Wiśniewski' },
        { type: 'link', before: 'Email: ', href: 'mailto:kontakt@powiatdecyduje.pl', label: 'kontakt@powiatdecyduje.pl' },
        { type: 'p', text: 'Email subject: Account deletion — Powiat Decyduje' },
        {
          type: 'p',
          text: 'In your message, please provide the phone number or email address used in the app so that the account can be identified.',
        },
        {
          type: 'p',
          text: 'After receiving the request, the administrator may ask for additional identity confirmation to prevent unauthorized account deletion.',
        },
        {
          type: 'p',
          text: 'Data will be deleted or anonymized unless the law requires further retention.',
        },
        { type: 'link', before: 'More information: ', href: '/privacy', label: 'Privacy Policy', after: '.' },
      ],
    },
    'safety-standards': {
      title: 'Child Safety Standards and CSAE Prevention',
      metaDescription:
        'Child safety standards and CSAE prevention in the Powiat Decyduje app.',
      lastUpdated: SAFETY_STANDARDS_LAST_UPDATED.en,
      blocks: [
        {
          type: 'p',
          text: 'The Powiat Decyduje app does not tolerate any content, behaviour or activity related to child sexual abuse and exploitation, child harm, or materials depicting child sexual abuse.',
        },
        {
          type: 'p',
          text: 'It is prohibited to create, submit, publish, report or distribute any content that may:',
        },
        {
          type: 'ul',
          items: [
            'depict or promote child sexual abuse or exploitation,',
            'facilitate contact with a child for the purpose of abuse or harm,',
            'contain CSAM, meaning child sexual abuse material,',
            'violate child safety or applicable law.',
          ],
        },
        {
          type: 'p',
          text: 'Powiat Decyduje is an app designed for browsing local projects, viewing initiatives on a map and supporting civic participation among residents. The app is not intended for dating, private communication with children or publishing sexual content.',
        },
        { type: 'h2', text: 'Reporting violations' },
        {
          type: 'p',
          text: 'Users can report violations, concerning content or safety issues by contacting the app administrator.',
        },
        { type: 'p', text: 'Contact email:' },
        {
          type: 'link',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        {
          type: 'p',
          text: 'If a report concerns child safety or suspected CSAE/CSAM, the administrator will take appropriate action, including reviewing the report, removing prohibited content, blocking accounts or reporting the matter to the relevant authorities where required by law.',
        },
        { type: 'h2', text: 'Child safety point of contact' },
        {
          type: 'p',
          text: 'The person or team responsible for child safety and CSAE reports:',
        },
        { type: 'p', text: 'Powiat Decyduje' },
        {
          type: 'link',
          href: 'mailto:kontakt@powiatdecyduje.pl',
          label: 'kontakt@powiatdecyduje.pl',
        },
        { type: 'h2', text: 'Cooperation with authorities and legal compliance' },
        {
          type: 'p',
          text: 'Powiat Decyduje complies with applicable laws related to child protection and prevention of child sexual abuse and exploitation. If the administrator becomes aware of CSAM or activities that may endanger children, appropriate action will be taken in accordance with the law.',
        },
        { type: 'p', text: `Last updated: ${SAFETY_STANDARDS_LAST_UPDATED.en}` },
      ],
    },
  },
};
