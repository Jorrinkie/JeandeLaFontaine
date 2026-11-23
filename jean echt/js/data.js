/* =========================================================
   DATA — In de voetsporen van Jean de La Fontaine
   Alle inhoud: verhalen, quizzen, vocabulaire, escaperooms
   ========================================================= */

const AVATARS = ["🧑‍🎓","👩‍🎓","🦊","🐺","🐢","🐇","🦁","🐦‍⬛","🦉","🐭","🐸","🕊️","👑","🎭","🖋️","🌟"];

const BADGES = {
  b1:{name:"Vriend van Jean", icon:"🤝"},
  b2:{name:"Hofgeleerde",     icon:"👑"},
  b3:{name:"Fabelkenner",     icon:"📖"},
  b4:{name:"Leerling-schrijver",icon:"✍️"},
  b5:{name:"Fabelmaker",      icon:"🪶"},
  b6:{name:"Meester van de Moraal", icon:"🏛️"}
};

/* Inspiratiekaarten voor de fabel (H5) */
const INSPIRE_ANIMALS = [
  {emoji:"🦊", nl:"vos",   fr:"le renard",  trait:"sluw / rusé"},
  {emoji:"🐺", nl:"wolf",  fr:"le loup",    trait:"hebzuchtig / avide"},
  {emoji:"🐢", nl:"schildpad", fr:"la tortue", trait:"geduldig / patient"},
  {emoji:"🐇", nl:"haas",  fr:"le lièvre",  trait:"snel / rapide"},
  {emoji:"🦁", nl:"leeuw", fr:"le lion",    trait:"trots / fier"},
  {emoji:"🐜", nl:"mier",  fr:"la fourmi",  trait:"vlijtig / travailleur"},
  {emoji:"🦗", nl:"krekel",fr:"la cigale",  trait:"zorgeloos / insouciant"},
  {emoji:"🐦‍⬛", nl:"raaf", fr:"le corbeau", trait:"ijdel / vaniteux"},
  {emoji:"🐭", nl:"muis",  fr:"la souris",  trait:"klein maar slim / petit"},
  {emoji:"🦉", nl:"uil",   fr:"le hibou",   trait:"wijs / sage"}
];

const MORALS_FR = [
  {fr:"Rien ne sert de courir ; il faut partir à point.", nl:"Hard rennen heeft geen zin; je moet op tijd vertrekken."},
  {fr:"Tel est pris qui croyait prendre.", nl:"Wie een ander wil beetnemen, wordt zelf beetgenomen."},
  {fr:"La raison du plus fort est toujours la meilleure.", nl:"Het recht van de sterkste geldt altijd."},
  {fr:"Apprenez que tout flatteur vit aux dépens de celui qui l'écoute.", nl:"Wie vleit, leeft ten koste van wie luistert."}
];

const CHAPTERS = [
  /* ================= HOOFDSTUK 1 ================= */
  {
    id:"ch1", num:1, badge:"b1",
    title:"Ontmoet Jean",
    subtitle:"Wie was Jean de La Fontaine?",
    emoji:"🪶",
    goal:"Maak kennis met Jean de La Fontaine en zijn leven.",
    steps:[
      {
        type:"narrative", title:"Bienvenue!",
        jean:[
          "Ah, daar ben je! Ik ben <strong>Jean de La Fontaine</strong>, geboren in het jaar 1621 in het stadje <em>Château-Thierry</em>, in de streek Champagne.",
          "Ik werd de beroemdste <em>fabuliste</em> — fabelschrijver — van Frankrijk. Kom mee, dan leer ik je alles over mijn leven, mijn tijd en de kunst van de fabel.",
          "Aan het einde van elke reis wacht een <strong>schrijfkist</strong> vol geheimen. Verzamel <strong>veren (plumes)</strong> en <strong>badges</strong> om die te openen. On y va — daar gaan we!"
        ],
        readText:`<p class="read-label">📜 <em>La Fontaine — Préface des Fables (1668, openingsregels)</em></p>
<blockquote class="read-quote">
  « Je <span class="tt" data-tip="ik zing / I sing">chante</span> les <span class="tt" data-tip="helden / heroes">héros</span> dont <span class="tt" data-tip="Ésopus — de Griekse fabelschrijver">Ésope</span> est le père,<br>
  Troupe de qui l'histoire, <span class="tt" data-tip="hoewel / although">encor que</span> <span class="tt" data-tip="verzonnen / fictional">mensongère</span>,<br>
  Contient des <span class="tt" data-tip="waarheden / truths">vérités</span> qui <span class="tt" data-tip="dienen als / serve as">servent de</span> <span class="tt" data-tip="lessen / lessons">leçons</span>. »
</blockquote>
<p class="read-trans">→ Ik schrijf over de helden van wie Ésopus de vader is. Hun verhalen zijn verzonnen — maar ze bevatten echte waarheden die als lessen dienen.</p>`,
        readTextSimple:`<p class="read-label">📜 <em>La Fontaine over zijn fabels — vereenvoudigd</em></p>
<p class="read-simple-text">La Fontaine schrijft over dezelfde dieren als de oude Griek Ésopus. De verhalen zijn niet echt — maar ze bevatten echte wijsheden. Ze leren je iets over het leven.</p>`,
        check:[
          {v:"Wie was de 'vader' van de fabelhelden die La Fontaine beschrijft?",
           options:["Lodewijk XIV","Ésope (Aesopus)","Molière","Zijn eigen vader"],
           correct:1},
          {v:"Zijn de fabelverhalen echt gebeurd?",
           options:["Ja, het zijn ware gebeurtenissen","Nee, maar ze bevatten echte wijsheden","Nee, ze zijn alleen grappig bedoeld"],
           correct:1}
        ]
      },
      {
        type:"tour", title:"Belevenis — In de voetsporen van Jean",
        intro:"Voordat je aan de opdrachten begint: loop mee in de voetsporen van Jean. Bezoek zijn geboortestad, zijn huis en de plekken die zijn leven bepaalden. Klik op ▶ Volgende.",
        rooms:[
          {
            img:"img/chateauthierry.jpg", name:"1. Château-Thierry — waar het begon", fr:"la ville de Château-Thierry",
            text:"Welkom in <strong>Château-Thierry</strong>, het stadje in de streek Champagne waar Jean in <strong>1621</strong> werd geboren. Dit is de <em>Porte Saint-Pierre</em>, een oude stadspoort uit de middeleeuwen. Als kind liep Jean door deze straten.",
            fact:"Château-Thierry ligt zo'n 95 km ten oosten van Parijs."
          },
          {
            img:"img/geboortehuis.jpg", name:"2. Het geboortehuis van Jean", fr:"la maison natale",
            text:"Dit deftige huis is het <strong>geboortehuis</strong> van Jean de La Fontaine. Zijn vader was een belangrijke ambtenaar (opzichter van de wateren en bossen). Vandaag is het een <strong>museum</strong> over Jeans leven en zijn fabels.",
            fact:"Je kunt het Musée Jean de La Fontaine er nu nog steeds bezoeken."
          },
          {
            img:"img/champagne.jpg", name:"3. De streek Champagne", fr:"la Champagne",
            text:"Rondom Château-Thierry strekken de <strong>wijngaarden van de Champagne</strong> zich uit. Tussen deze glooiende heuvels, bossen en rivieren groeide Jean op. De natuur en de dieren die hij hier zag, komen terug in zijn fabels.",
            fact:"Uit deze streek komt ook de beroemde mousserende wijn: champagne."
          },
          {
            img:"img/academie.jpg", name:"4. De Académie française", fr:"l'Académie française",
            text:"Jean vertrok naar <strong>Parijs</strong> om schrijver te worden en zocht een <em>mécène</em> (beschermheer). Zijn talent werd beloond: in <strong>1684</strong> werd hij lid van de <strong>Académie française</strong>, het genootschap dat waakt over de Franse taal. Een grotere eer bestond er niet.",
            fact:"De Académie française bestaat nog steeds en heeft precies 40 leden, 'de onsterfelijken' genoemd."
          },
          {
            img:"img/fablesboek.jpg", name:"5. De beroemde Fables", fr:"les Fables",
            text:"In <strong>1668</strong> verschenen Jeans <strong>Fables</strong>. Hier zie je een gravure van « <em>Le Corbeau et le Renard</em> »: de raaf in de boom en de sluwe vos eronder. Met dieren als personages leerde Jean de mensen wijze lessen.",
            fact:"Deze gravure is van Gustave Doré, een beroemde 19e-eeuwse illustrator."
          },
          {
            img:"img/standbeeld.jpg", name:"6. Voor altijd geëerd", fr:"le monument",
            text:"Jean stierf in <strong>1695</strong>, maar wordt nog steeds geëerd. In heel Frankrijk staan <strong>standbeelden</strong> voor hem, vaak met zijn fabeldieren zoals de vos en de leeuw eromheen. Zijn fabels worden nog altijd op school gelezen — ook door jou!",
            fact:"Dit monument voor La Fontaine stond rond 1900 in Parijs."
          }
        ]
      },
      {
        type:"quiz", title:"Interactieve quiz — Het leven van Jean",
        intro:"Lees goed en kies het juiste antwoord. Elk goed antwoord levert een veer op!",
        questions:[
          {q:"In welk jaar werd Jean de La Fontaine geboren?",
           options:["1521","1621","1721","1665"], answer:1,
           explain:"Jean werd geboren in 1621, aan het begin van de 17e eeuw."},
          {q:"In welke Franse stad werd hij geboren?",
           options:["Parijs","Lyon","Château-Thierry","Versailles"], answer:2,
           explain:"Hij werd geboren in Château-Thierry in de streek Champagne."},
          {q:"Waar is Jean vooral beroemd om geworden?",
           options:["Zijn schilderijen","Zijn fabels (fables)","Zijn oorlogen","Zijn kastelen"], answer:1,
           explain:"Zijn 'Fables' maakten hem wereldberoemd. Een fabel = une fable."},
          {q:"Welke opleiding volgde Jean eerst?",
           options:["Geneeskunde","Rechten (jura)","Sterrenkunde","Muziek"], answer:1,
           explain:"Jean studeerde eerst rechten voordat hij zich op de literatuur richtte."},
          {q:"Wie inspireerde La Fontaine met oude fabels?",
           options:["Napoleon","De Griek Ésope (Aesopus)","Julius Caesar","Molière"], answer:1,
           explain:"De oude Griek Ésope (Aesopus) schreef al fabels; La Fontaine gaf ze nieuw leven."}
        ],
        challenge:[
          {q:"In welke eeuw leefde Jean de La Fontaine grotendeels?", options:["De 17e eeuw","De 15e eeuw","De 19e eeuw"], answer:0, explain:"Geboren 1621, gestorven 1695 — de 17e eeuw (le XVIIe siècle)."},
          {q:"Wat is een 'fabuliste'?", options:["Een fabelschrijver","Een schilder","Een soldaat"], answer:0, explain:"« un fabuliste » = een fabelschrijver, zoals La Fontaine."}
        ]
      },
      {
        type:"order", title:"Sleepopdracht — De tijdlijn van Jean",
        intro:"Sleep de gebeurtenissen in de juiste volgorde, van vroeg naar laat.",
        items:[
          {year:"1621", label:"Jean wordt geboren in Château-Thierry"},
          {year:"1641", label:"Hij begint met studeren (o.a. rechten)"},
          {year:"1658", label:"Hij werkt voor beschermheer Nicolas Fouquet"},
          {year:"1668", label:"Zijn eerste bundel 'Fables' verschijnt"},
          {year:"1684", label:"Hij wordt lid van de Académie française"},
          {year:"1695", label:"Jean de La Fontaine overlijdt in Parijs"}
        ]
      },
      {
        type:"escape", title:"Escaperoom — De oude schrijfkist",
        story:"Voor je staat een stoffige, vergrendelde schrijfkist van Jean. De kist opent alleen als je vijf vragen over zijn leven goed beantwoordt. <strong>Lees eerst zijn levensbrief hieronder</strong> — daarin staan alle antwoorden verstopt. Elke goed beantwoorde aanwijzing geeft je één <strong>letter</strong>. Los daarna het slot op.",
        reading:"<strong>📜 Uit de levensbrief van Jean de La Fontaine:</strong><br><br>« Ik kwam ter wereld in het jaar <em>1621</em>, in het stadje <em>Château-Thierry</em> in de streek Champagne. Mijn vader wilde dat ik <em>rechten</em> (la Loi) zou studeren, en dat deed ik gehoorzaam. Maar mijn hart lag altijd bij de verhalen. De oude Griek <em>Ésope</em> (Aesopus) had eeuwen vóór mij al fabels geschreven; ík gaf ze nieuw leven in het Frans. In <em>1668</em> verscheen mijn eerste bundel <em>Fables</em>. En in <em>1684</em> werd ik gekozen tot lid van de <em>Académie française</em> — de hoogste eer die een Frans schrijver kan krijgen. »",
        clues:[
          {ico:"📜", label:"Aanwijzing 1 — De geboorte", symbol:"P",
           question:"In welk jaar en in welke stad werd Jean geboren?",
           options:["1521 in Parijs","1621 in Château-Thierry","1665 in Versailles","1621 in Lyon"], answer:1,
           explain:"Juist — in 1621, te Château-Thierry in de streek Champagne. Je verdient de letter P."},
          {ico:"⚖️", label:"Aanwijzing 2 — De studie", symbol:"L",
           question:"Welke studie volgde Jean op wens van zijn vader?",
           options:["Geneeskunde","Rechten (la Loi)","Sterrenkunde","Theologie"], answer:1,
           explain:"Klopt — hij studeerde eerst rechten (la Loi). Daarom de letter L."},
          {ico:"🏺", label:"Aanwijzing 3 — De inspiratie", symbol:"U",
           question:"Welke oude Griek inspireerde Jean met zijn fabels?",
           options:["Homerus","Ésope (Aesopus)","Plato","Sokrates"], answer:1,
           explain:"Precies — Ésope schreef de eerste fabels. La Fontaine gaf ze nieuw leven. Letter: U."},
          {ico:"📚", label:"Aanwijzing 4 — De eerste bundel", symbol:"M",
           question:"In welk jaar verscheen Jeans eerste bundel 'Fables'?",
           options:["1621","1643","1668","1695"], answer:2,
           explain:"Juist — de eerste 'Fables' verschenen in 1668. De letter M is van jou."},
          {ico:"🏛️", label:"Aanwijzing 5 — De grote eer", symbol:"E",
           question:"Van welk beroemd gezelschap werd Jean in 1684 lid?",
           options:["De Académie française","Het leger van de koning","De Sorbonne-universiteit","Het parlement van Parijs"], answer:0,
           explain:"Correct — de Académie française, de hoogste eer voor een schrijver. Je laatste letter: E."}
        ],
        code:"PLUME", codeHint:"Vijf letters. Het Franse woord voor de 'veer' waarmee Jean schreef — en tegelijk voor een pen.",
        success:"De kist klikt open! Binnenin ligt een gouden ganzenveer. Je bent nu een echte Vriend van Jean."
      }
    ]
  },

  /* ================= HOOFDSTUK 2 ================= */
  {
    id:"ch2", num:2, badge:"b2",
    title:"Het hof van de Zonnekoning",
    subtitle:"Frankrijk in de 17e eeuw",
    emoji:"👑",
    goal:"Begrijp de historische context: het Frankrijk van Lodewijk XIV.",
    steps:[
      {
        type:"narrative", title:"Le Roi-Soleil",
        jean:[
          "In mijn tijd regeerde <strong>Lodewijk XIV</strong> (Louis Quatorze), bijgenaamd <em>le Roi-Soleil</em> — de <strong>Zonnekoning</strong>. Bekijk hieronder zijn echte staatsieportret.",
          "Hij bouwde het immense <strong>Château de Versailles</strong>, waar het hof leefde in weelde: spiegels, tuinen, bals en intriges.",
          "Kunstenaars en schrijvers zochten de gunst van de koning. Loop met mij mee door het échte Versailles en ontdek de geheimen van het hof."
        ],
        readText:`<p class="read-label">📜 <em>Saint-Simon — Mémoires (geschreven ±1700, over het leven aan het hof)</em></p>
<blockquote class="read-quote">
  « <span class="tt" data-tip="iedereen / everyone">Tout</span> le monde <span class="tt" data-tip="wou gezien worden / wanted to be seen">voulait être vu</span> du <span class="tt" data-tip="de koning / the king">roi</span>. Sa <span class="tt" data-tip="aanwezigheid / presence">présence</span> seule <span class="tt" data-tip="maakte / made">faisait</span> le <span class="tt" data-tip="geluk / happiness">bonheur</span> ou le <span class="tt" data-tip="ongeluk / unhappiness">malheur</span> de ceux qui l'<span class="tt" data-tip="naderden / approached">approchaient</span>. »
</blockquote>
<p class="read-trans">→ Iedereen wilde door de koning gezien worden. Zijn aanwezigheid alléén maakte de mensen rondom hem gelukkig of ongelukkig.</p>`,
        readTextSimple:`<p class="read-label">📜 <em>Saint-Simon over het hof — vereenvoudigd</em></p>
<p class="read-simple-text">Aan het hof van Versailles draaide alles om de koning. Wie hij aankeek, voelde zich gelukkig. Wie hij negeerde, voelde zich ellendig. Iedereen wilde zijn gunst winnen.</p>`,
        check:[
          {v:"Wat maakte het verschil tussen geluk en ongeluk voor de hovelingen?",
           options:["Hun eigen rijkdom","Of de koning naar hen keek","Hoe groot hun kamer was","Of ze muziek konden spelen"], correct:1},
          {v:"Wat zegt deze tekst over de macht van Lodewijk XIV?",
           options:["Hij had bijna geen macht","Zijn aanwezigheid alleen al bepaalde de sfeer voor iedereen","De hovelingen negeerden hem","Hij was altijd vriendelijk voor iedereen"], correct:1}
        ],
        images:[
          {src:"img/louis14.jpg", cap:"Lodewijk XIV, 'le Roi-Soleil' — staatsieportret door Hyacinthe Rigaud (1701)."},
          {src:"img/versailles.jpg", cap:"Het echte Château de Versailles: de Cour de Marbre (marmeren binnenplaats)."}
        ]
      },
      {
        type:"tour", title:"Belevenis — Loop mee met de Zonnekoning",
        intro:"Stap in de 17e eeuw. Volg Lodewijk XIV door de échte zalen van Versailles — en ontdek daarna hoe anders het leven van de gewone burger eruitzag. Klik op ▶ Volgende om verder te lopen.",
        rooms:[
          {
            img:"img/versailles.jpg", name:"1. De Cour de Marbre", fr:"la Cour de Marbre",
            text:"Je staat op de <strong>marmeren binnenplaats</strong>. Elke dag verdrongen honderden hovelingen (<em>les courtisans</em>) zich hier, hopend op één blik van de koning. Alleen wie rijk en van adel was, mocht dichterbij komen.",
            fact:"Wist je dat? Aan het hof leefden zo'n 3.000 tot 10.000 mensen rond de koning."
          },
          {
            img:"img/hall_of_mirrors.jpg", name:"2. De Spiegelzaal", fr:"la galerie des Glaces",
            text:"De koning loopt voor je uit door de <strong>Spiegelzaal</strong>. Maar liefst <strong>357 spiegels</strong> weerkaatsen het licht van duizenden kaarsen. Hier ontving Lodewijk XIV ambassadeurs uit de hele wereld — alles moest zijn macht en rijkdom laten zien.",
            fact:"Spiegels waren toen enorm duur. Een hele zaal vol spiegels was pure show van rijkdom."
          },
          {
            img:"img/chambre_roi.jpg", name:"3. De slaapkamer van de koning", fr:"la chambre du roi",
            text:"Elke ochtend was er <em>le lever du roi</em>: uitgekozen edelen mochten toekijken hoe de koning wakker werd en werd aangekleed. Wie hem zijn hemd mocht aangeven, had groot aanzien. Zelfs opstaan was hier een <strong>openbaar schouwspel</strong>.",
            fact:"De koning at ook vaak in het openbaar: het hof keek toe hoe hij zijn maaltijd nuttigde."
          },
          {
            img:"img/jardins.jpg", name:"4. De tuinen", fr:"les jardins",
            text:"In de eindeloze <strong>tuinen</strong> van tuinarchitect André Le Nôtre wandelde het hof tussen fonteinen en perfect geknipte hagen. 's Avonds waren er feesten, muziek en vuurwerk. Zelfs de natuur moest buigen voor de wil van de koning.",
            fact:"De tuinen zijn zó groot dat je er kilometers in kunt wandelen — met honderden fonteinen."
          },
          {
            img:"img/paysans.jpg", name:"5. Buiten de poorten: de gewone burger", fr:"le paysan / le peuple",
            text:"Maar buiten de vergulde poorten was het leven héél anders. De gewone burger — vooral de <strong>boer</strong> (<em>le paysan</em>) — werkte hard op het land en betaalde zware <strong>belastingen</strong> om de weelde van het hof te betalen. Veel gezinnen leefden in armoede, in kleine, donkere huizen.",
            fact:"Schilderij: « Famille de paysans » van Louis Le Nain (±1642), Musée du Louvre."
          },
          {
            img:"img/boeren.jpg", name:"6. Een maaltijd van het volk", fr:"le repas des paysans",
            text:"Een boerenmaaltijd bestond vaak uit <strong>brood, soep en soms wat wijn</strong>. Terwijl het hof feestte, wisten veel families niet of er de volgende dag genoeg te eten zou zijn. Juist die tegenstelling tussen arm en rijk zag Jean de La Fontaine — en verwerkte hij in zijn fabels.",
            fact:"« La raison du plus fort est toujours la meilleure » — het recht van de sterkste. La Fontaine bekritiseerde zo de macht van de rijken."
          }
        ]
      },
      {
        type:"hotspots", title:"Virtuele ontdekkingstocht door Versailles",
        intro:"Klik op de verborgen symbolen in het paleis. Vind ze allemaal om verder te gaan!",
        needed:5,
        spots:[
          {id:"sun",   label:"☀️ Het zonne-embleem", fr:"le soleil"},
          {id:"mirror",label:"🪞 Spiegelzaal", fr:"la galerie des Glaces"},
          {id:"crown", label:"👑 De kroon", fr:"la couronne"},
          {id:"garden",label:"🌳 De tuinen", fr:"les jardins"},
          {id:"key",   label:"🗝️ De sleutel van Jean", fr:"la clé"}
        ]
      },
      {
        type:"match", title:"Woordenschatspel — Frans ↔ Nederlands",
        intro:"Klik een Frans woord aan en daarna de juiste Nederlandse vertaling. Havo 3-woordenschat rond het hof.",
        leftLabel:"Français", rightLabel:"Nederlands",
        pairs:[
          {left:"le roi", right:"de koning"},
          {left:"le château", right:"het kasteel"},
          {left:"la reine", right:"de koningin"},
          {left:"le jardin", right:"de tuin"},
          {left:"la cour", right:"het hof"},
          {left:"le pouvoir", right:"de macht"}
        ]
      },
      {
        type:"perspective",
        title:"Keuzepad — Jouw ogen in Versailles",
        intro:"Kies een perspectief. Wie ben jij in het 17e-eeuwse Frankrijk?",
        options:[
          {
            id:"hoveling", label:"👑 Een hoveling", fr:"le courtisan",
            desc:"Je leeft aan het hof van Versailles. Weelde, intriges en de gunst van de koning — dat is jouw wereld.",
            questions:[
              {q:"Wat doe jij elke ochtend als hoveling bij 'le lever du roi'?",
               options:["Je kijkt toe hoe de koning wordt aangekleed","Je werkt op het land","Je gaat naar de markt","Je slaapt uit"],
               answer:0, explain:"Le lever du roi bijwonen was een eer — hoe dichter bij de koning, hoe meer aanzien aan het hof."},
              {q:"Je wilt de gunst van de koning. Hoe doe je dat aan het hof?",
               options:["Door hem te vleien en op te vallen","Door belasting te betalen","Door weg te gaan uit Versailles","Door hard te bidden"],
               answer:0, explain:"Aan het hof draaide alles om opvallen en vleien — precies wat La Fontaine bekritiseerde in zijn fabels."},
              {q:"Wat betekent het Franse woord 'le courtisan'?",
               options:["De hoveling","De boer","De soldaat","De priester"],
               answer:0, explain:"'Le courtisan' = de hoveling, iemand die aan het hof van de koning leefde."},
              {q:"Hoe noemde men Lodewijk XIV, de koning ten tijde van La Fontaine?",
               options:["Le Roi-Soleil (de Zonnekoning)","Le Roi-Lion (de Leeuwenkoning)","Le Grand Monarque","Le Roi-Lune"],
               answer:0, explain:"'Le Roi-Soleil' — de Zonnekoning. Hij koos de zon als zijn persoonlijke symbool: één zon, één koning, één macht."}
            ]
          },
          {
            id:"boer", label:"🌾 Een gewone burger", fr:"le paysan",
            desc:"Buiten de vergulde poorten van Versailles woon jij. Belastingen, hard werk en weinig zekerheid — dat is jouw werkelijkheid.",
            questions:[
              {q:"Waarom heb jij als boer weinig geld, terwijl je hard werkt?",
               options:["Ik betaal zware belastingen om het hof te financieren","Ik koop te veel op de markt","Ik werk niet hard genoeg","Ik woon te ver van de stad"],
               answer:0, explain:"De weelde van Versailles werd betaald door de belastingen van gewone burgers — dat was de bittere realiteit."},
              {q:"Je ziet de rijkdom van Versailles van buiten de poorten. Wat zegt La Fontaine hierover in zijn fabels?",
               options:["De sterkste krijgt zijn zin, ook als dat oneerlijk is","Rijkdom is een beloning voor hard werken","Koningen verdienen alle weelde","Armoede is eigen schuld"],
               answer:0, explain:"'La raison du plus fort est toujours la meilleure' — La Fontaine bekritiseerde de macht van de rijken via zijn fabeldieren."},
              {q:"Hoe noemde men een rijke beschermheer die kunstenaars steunde?",
               options:["Un mécène","Un paysan","Un soldat","Un courtisan"],
               answer:0, explain:"'Un mécène' = een rijke beschermheer. La Fontaine zocht ook zo iemand om van te kunnen leven als schrijver."},
              {q:"Wat at een gewone boer in de 17e eeuw doorgaans?",
               options:["Brood, soep en soms wat wijn","Vlees, kaas en taart","Hetzelfde als de koning","Vis en rijst"],
               answer:0, explain:"Een boerenmaaltijd was eenvoudig: brood, soep en soms wat wijn. Terwijl het hof feestte, hadden velen nauwelijks genoeg."}
            ]
          }
        ]
      },
      {
        type:"escape", title:"Escaperoom — De geheime boodschap in Versailles",
        story:"In de <em>galerie des Glaces</em> (spiegelzaal) heeft Jean een gecodeerde boodschap achtergelaten. Onder elk symbool ligt een <strong>cijfer</strong>, maar je krijgt het pas als je de bijbehorende vraag goed beantwoordt. <strong>Lees eerst de tekst over het hof</strong> en vorm zo de geheime jaartalcode.",
        reading:"<strong>👑 Het Frankrijk van de Zonnekoning:</strong><br><br>Koning <em>Lodewijk XIV</em> (Louis Quatorze) werd <em>le Roi-Soleil</em> — de Zonnekoning — genoemd, omdat hij de zon als zijn persoonlijke symbool koos: één zon, één koning, één macht. Hij liet het immense <em>Château de Versailles</em> bouwen. In het jaar <em>1682</em> verhuisde hij samen met het hele hof officieel naar Versailles; vanaf dat moment was het paleis het echte machtscentrum van Frankrijk. Aan het hof (<em>la cour</em>) leefde de adel in weelde. Schrijvers en kunstenaars zochten een <em>mécène</em>: een rijke beschermheer die hen geld en aanzien gaf.",
        clues:[
          {ico:"☀️", label:"Cijfer 1 — De zon", symbol:"1",
           question:"Waarom werd Lodewijk XIV 'le Roi-Soleil' (de Zonnekoning) genoemd?",
           options:["Hij woonde aan zee","Hij koos de zon als symbool van zijn macht","Hij had rood haar","Hij regeerde alleen 's zomers"], answer:1,
           explain:"Juist — één zon, één koning, één macht. Cijfer: 1."},
          {ico:"🏛️", label:"Cijfer 2 — Het paleis", symbol:"6",
           question:"Welk paleis liet de Zonnekoning bouwen als centrum van zijn macht?",
           options:["Le Louvre","Notre-Dame","Het Château de Versailles","De Sorbonne"], answer:2,
           explain:"Klopt — het Château de Versailles. Cijfer: 6."},
          {ico:"👑", label:"Cijfer 3 — Het hof", symbol:"8",
           question:"Wat betekent het Franse woord 'la cour'?",
           options:["De keuken","Het hof (de adel rond de koning)","De kerk","De markt"], answer:1,
           explain:"Precies — 'la cour' is het hof, waar de adel rond de koning leefde. Cijfer: 8."},
          {ico:"🎨", label:"Cijfer 4 — De beschermheer", symbol:"2",
           question:"Wat is een 'mécène'?",
           options:["Een soldaat","Een tuinman","Een rijke beschermheer van kunstenaars","Een kok van de koning"], answer:2,
           explain:"Juist — een mécène gaf schrijvers geld en aanzien. Cijfer: 2."}
        ],
        code:"1682", codeHint:"4 cijfers — het jaar waarin de koning en het hof officieel naar Versailles verhuisden. Lees de tekst nog eens!",
        success:"De spiegels verschuiven en onthullen Jeans boodschap: « Observe le monde, et tu comprendras les hommes. » Je bent nu Hofgeleerde!"
      }
    ]
  },

  /* ================= HOOFDSTUK 3 ================= */
  {
    id:"ch3", num:3, badge:"b3",
    title:"De werkplaats van de fabelschrijver",
    subtitle:"Wat maakt een fabel een fabel?",
    emoji:"📖",
    goal:"Herken de kenmerken van een fabel en begrijp de moraal.",
    steps:[
      {
        type:"narrative", title:"Qu'est-ce qu'une fable?",
        jean:[
          "Een <strong>fabel (une fable)</strong> is een kort verhaal, vaak met <strong>dieren die praten en denken als mensen</strong>.",
          "Elke fabel eindigt met een <strong>moraal (la morale)</strong>: een wijze les over het leven. De dieren staan symbool voor menselijke eigenschappen — de vos is sluw, de leeuw trots.",
          "Kenmerken van een fabel: ✔ kort ✔ dieren als personages ✔ een duidelijke les ✔ vaak in versvorm. Kom, we oefenen!"
        ],
        readText:`<p class="read-label">📜 <em>La Fontaine — Fables I, 2 : Le Corbeau et le Renard (1668, openingsverzen)</em></p>
<blockquote class="read-quote">
  « <span class="tt" data-tip="meester (beleefdheid) / master">Maître</span> <span class="tt" data-tip="raaf / crow">Corbeau</span>, sur un <span class="tt" data-tip="boom / tree">arbre</span> <span class="tt" data-tip="gezeten / perched">perché</span>,<br>
  <span class="tt" data-tip="hield / held">Tenait</span> en son <span class="tt" data-tip="snavel / beak">bec</span> un <span class="tt" data-tip="stuk kaas / piece of cheese">fromage</span>.<br>
  <span class="tt" data-tip="meester / master">Maître</span> <span class="tt" data-tip="vos / fox">Renard</span>, par l'<span class="tt" data-tip="geur / smell">odeur</span> <span class="tt" data-tip="aangelokt / attracted">alléché</span>,<br>
  Lui <span class="tt" data-tip="hield (een toespraak) / held">tint</span> à peu près ce <span class="tt" data-tip="verhaal / speech">langage</span>... »
</blockquote>
<p class="read-trans">→ Meester Raaf zat in een boom met een stuk kaas in zijn snavel. Meester Vos, aangelokt door de geur, begon hem zo'n beetje als volgt toe te spreken…</p>`,
        readTextSimple:`<p class="read-label">📜 <em>Le Corbeau et le Renard — vereenvoudigd</em></p>
<p class="read-simple-text">Een raaf zit hoog in een boom. In zijn snavel houdt hij een stuk kaas. Een vos ruikt de kaas en wil hem hebben. Hij begint de raaf mooie dingen te zeggen… Wat er daarna gebeurt, leer je zo meteen!</p>`,
        check:[
          {v:"Waar zit de raaf aan het begin van het gedicht?",
           options:["Op de grond","In een boom","Naast de vos","Bij de rivier"], correct:1},
          {v:"Wat trekt de vos naar de raaf toe?",
           options:["Het geluid van muziek","De geur van de kaas","De mooie veren van de raaf","Het licht van de zon"], correct:1}
        ]
      },
      {
        type:"quiz", title:"Interactieve leesopdracht — Le Corbeau et le Renard",
        intro:"Lees de samenvatting en beantwoord de vragen.\n\n« Een raaf (le corbeau) heeft een stuk kaas. Een sluwe vos (le renard) prijst zijn prachtige stem. Trots begint de raaf te zingen — en laat de kaas vallen. De vos grijpt de kaas en verdwijnt. »",
        questions:[
          {q:"Welke twee dieren spelen de hoofdrol?",
           options:["Een wolf en een lam","Een raaf en een vos","Een haas en een schildpad","Een mier en een krekel"], answer:1,
           explain:"Le corbeau (de raaf) en le renard (de vos)."},
          {q:"Hoe krijgt de vos de kaas te pakken?",
           options:["Hij steelt hem 's nachts","Door de raaf te vleien","Hij koopt hem","Hij vraagt er beleefd om"], answer:1,
           explain:"De vos vleit de raaf zodat die begint te zingen en de kaas laat vallen."},
          {q:"Wat is de moraal van deze fabel?",
           options:["Wees nooit vriendelijk","Wie vleiers gelooft, wordt bedrogen","Eet nooit kaas","Zing zo hard je kunt"], answer:1,
           explain:"« Tout flatteur vit aux dépens de celui qui l'écoute » — pas op voor vleierij."}
        ],
        challenge:[
          {q:"Voor welke eigenschap staat de vos (le renard)?", options:["Sluw (rusé)","Lui","Verdrietig"], answer:0, explain:"De vos is « rusé » — sluw en listig."},
          {q:"Wat maakt iets tot een fabel?", options:["Dieren met een karakter én een moraal","Alleen dat het rijmt","Dat het over koningen gaat"], answer:0, explain:"Een fabel = dieren als personages + een wijze les (la morale)."}
        ]
      },
      {
        type:"match", title:"Sleepopdracht — Personage koppelen aan eigenschap",
        intro:"Koppel elk fabeldier aan de eigenschap waar het symbool voor staat.",
        leftLabel:"Le personnage", rightLabel:"De eigenschap",
        pairs:[
          {left:"🦊 le renard (vos)", right:"sluw / listig"},
          {left:"🐢 la tortue (schildpad)", right:"geduldig / volhardend"},
          {left:"🦁 le lion (leeuw)", right:"trots / machtig"},
          {left:"🐜 la fourmi (mier)", right:"vlijtig / spaarzaam"},
          {left:"🦗 la cigale (krekel)", right:"zorgeloos / lui"}
        ]
      },
      {
        type:"sort",
        title:"Sorteeropdracht — Bouw een fabel",
        intro:"Sleep elke zin naar de juiste categorie. Zo zie je hoe een fabel is opgebouwd.",
        categories:["Personage","Conflict","Moraal","Geen van alle"],
        items:[
          {text:"De sluwe vos vleit de trotse raaf.",           correct:"Conflict"},
          {text:"De leeuw is trots en machtig.",                correct:"Personage"},
          {text:"Pas op voor vleiers — ze willen iets van je.", correct:"Moraal"},
          {text:"De mier werkt de hele zomer hard.",            correct:"Personage"},
          {text:"De raaf laat zijn kaas vallen.",               correct:"Conflict"},
          {text:"Het weer was die dag erg mooi.",               correct:"Geen van alle"},
          {text:"Wie niet spaart in goede tijden, lijdt later.",correct:"Moraal"},
          {text:"De krekel vraagt de mier om hulp in de winter.",correct:"Conflict"}
        ]
      },
      {
        type:"escape", title:"Escaperoom — De verdwenen moralen",
        story:"Ramp! De moralen zijn uit Jeans fabelboek verdwenen. Om ze terug te halen moet je bewijzen dat je écht begrijpt wat een fabel is. <strong>Lees de wijsheden hieronder</strong> en beantwoord elke aanwijzing goed; samen vormen de letters het sleutelwoord.",
        reading:"<strong>📖 Wat je over de fabel moet weten:</strong><br><br>Een <em>fabel</em> is een kort verhaal waarin <em>dieren praten en denken als mensen</em>. Elk dier staat symbool voor een menselijke eigenschap: de <em>vos</em> is sluw, de <em>schildpad</em> geduldig en volhardend, de <em>leeuw</em> trots en machtig, de <em>mier</em> vlijtig en spaarzaam, de <em>krekel</em> zorgeloos en lui. Elke fabel eindigt met een <em>moraal</em>: een wijze les over het leven. In « Le Corbeau et le Renard » (De raaf en de vos) vleit de sluwe vos de trotse raaf, zodat die gaat zingen en zijn kaas laat vallen. De les: pas op voor vleiers.",
        clues:[
          {ico:"🦊", label:"Letter 1 — De vos", symbol:"M",
           question:"Voor welke eigenschap staat de vos (le renard) in de fabels?",
           options:["Sluw en listig","Lui en traag","Verdrietig","Sterk en dom"], answer:0,
           explain:"Juist — de vos is sluw en listig. Letter: M."},
          {ico:"🐢", label:"Letter 2 — De schildpad", symbol:"O",
           question:"Voor welke eigenschap staat de schildpad (la tortue)?",
           options:["Snel en ongeduldig","Geduldig en volhardend","Vals","Bang"], answer:1,
           explain:"Klopt — geduldig en volhardend; zo wint zij van de haas. Letter: O."},
          {ico:"🦁", label:"Letter 3 — De raaf en de vos", symbol:"R",
           question:"Wat is de moraal van « Le Corbeau et le Renard » (de raaf en de vos)?",
           options:["Zing zo hard je kunt","Eet nooit kaas","Wie vleiers gelooft, wordt bedrogen","Wees nooit vriendelijk"], answer:2,
           explain:"Precies — pas op voor vleierij. « Tout flatteur vit aux dépens de celui qui l'écoute. » Letter: R."},
          {ico:"🐜", label:"Letter 4 — De mier", symbol:"A",
           question:"Voor welke eigenschap staat de mier (la fourmi)?",
           options:["Vlijtig en spaarzaam","Verkwistend","Trots","Zorgeloos"], answer:0,
           explain:"Juist — vlijtig en spaarzaam. Zij denkt vooruit aan de winter. Letter: A."},
          {ico:"🦗", label:"Letter 5 — Het fabelkenmerk", symbol:"L",
           question:"Wat hoort er in élke fabel te staan, naast de dieren?",
           options:["Een gevecht","Een moraal (een wijze les)","Een koning","Een liefdesverhaal"], answer:1,
           explain:"Correct — elke fabel eindigt met een moraal, een wijze les. Letter: L."}
        ],
        code:"MORAL", codeHint:"5 letters — het kernbegrip van elke fabel (denk aan het woord 'morale' zonder de laatste e).",
        success:"De moralen keren terug in het boek! Je begrijpt nu de kern van de fabel. Je bent Fabelkenner!"
      }
    ]
  },

  /* ================= HOOFDSTUK 4 ================= */
  {
    id:"ch4", num:4, badge:"b4",
    title:"Leerling van Jean",
    subtitle:"Zelf fabels analyseren",
    emoji:"🔍",
    goal:"Analyseer zelfstandig fabels en maak eigen keuzes.",
    steps:[
      {
        type:"narrative", title:"À toi de jouer!",
        jean:[
          "Nu is het jouw beurt, mon élève. Je gaat zelf fabels <strong>analyseren</strong>: wie zijn de personages, wat gebeurt er, en wat is de les?",
          "Kies een moeilijkheidsgraad die bij je past. Wees eerlijk en denk goed na — een goede leerling durft keuzes te maken."
        ],
        readText:`<p class="read-label">📜 <em>La Fontaine — Fables I, 1 : La Cigale et la Fourmi (1668, openingsverzen)</em></p>
<blockquote class="read-quote">
  « La <span class="tt" data-tip="krekel / cricket">Cigale</span>, <span class="tt" data-tip="nadat ze had gezongen / having sung">ayant chanté</span><br>
  Tout l'<span class="tt" data-tip="de zomer / the summer">été</span>,<br>
  Se <span class="tt" data-tip="bevond zich / found herself">trouva</span> fort <span class="tt" data-tip="behoeftig, zonder iets / in great need">dépourvue</span><br>
  Quand la <span class="tt" data-tip="koude noordenwind / cold north wind (= winter)">bise</span> fut <span class="tt" data-tip="gekomen / had come">venue</span>. »
</blockquote>
<p class="read-trans">→ De krekel, die de hele zomer had gezongen, bevond zich in grote nood toen de koude winterwind aankwam.</p>`,
        readTextSimple:`<p class="read-label">📜 <em>La Cigale et la Fourmi — vereenvoudigd</em></p>
<p class="read-simple-text">De krekel zong de hele zomer lang. Ze dacht niet aan de winter. Maar toen het koud werd, had ze niets — geen eten, geen onderdak. Ze had niet gespaard. Nu is het bijna te laat...</p>`,
        check:[
          {v:"Wat deed la Cigale (de krekel) de hele zomer?",
           options:["Werken en sparen","Zingen en genieten","Slapen","Eten zoeken voor de winter"], correct:1},
          {v:"Wat gebeurde er toen la bise (de koude wind / winter) aankwam?",
           options:["De krekel was goed voorbereid","De krekel had niets en zat in de problemen","De mier hielp haar meteen","Het werd juist warmer"], correct:1}
        ]
      },
      {
        type:"quiz", title:"Analyse — La Cigale et la Fourmi (De krekel en de mier)",
        intro:"« De krekel (la cigale) zong de hele zomer. Toen de winter kwam, had zij geen eten. Zij vroeg de mier (la fourmi) om hulp. De mier, die de hele zomer had gewerkt en gespaard, weigerde: 'Je zong? Dan kun je nu dansen!' »",
        questions:[
          {q:"Wat deed de krekel de hele zomer?",
           options:["Werken en sparen","Zingen en genieten","Slapen","Reizen"], answer:1,
           explain:"La cigale zong en genoot, zonder aan de winter te denken."},
          {q:"Waarom weigert de mier te helpen?",
           options:["Ze is boos","De krekel had ook kunnen werken en sparen","Ze heeft zelf te weinig","Ze houdt niet van muziek"], answer:1,
           explain:"De mier had gewerkt; de krekel niet. Vandaar de harde les."},
          {q:"Welke moraal past het best?",
           options:["Werk hard en denk vooruit","Zing altijd","Deel nooit iets","Slaap in de winter"], answer:0,
           explain:"Wie in goede tijden vooruitdenkt, heeft het in slechte tijden beter."},
          {q:"Voor welke menselijke eigenschap staat de mier?",
           options:["Luiheid","Vlijt en verstandigheid","Gierigheid alleen","Domheid"], answer:1,
           explain:"De mier symboliseert vlijt, spaarzaamheid en vooruitzien."}
        ],
        challenge:[
          {q:"Wat betekent « la fourmi »?", options:["De mier","De krekel","De winter"], answer:0, explain:"« la fourmi » = de mier (vlijtig en spaarzaam)."},
          {q:"Waarom kiest La Fontaine dieren i.p.v. mensen?", options:["Dieren maken de les duidelijk én veilig te vertellen","Omdat mensen niet konden lezen","Omdat dieren grappiger zijn"], answer:0, explain:"Via dieren wordt de les helder en kan hij ongestraft kritiek geven."}
        ]
      },
      {
        type:"match", title:"Keuzepad — Koppel de Franse titel aan het verhaal",
        intro:"Test je kennis van La Fontaines beroemdste fabels: koppel de Franse titel aan de juiste beschrijving.",
        leftLabel:"Titre français", rightLabel:"Het verhaal",
        pairs:[
          {left:"Le Lièvre et la Tortue", right:"Een snelle haas verliest van een trage schildpad."},
          {left:"Le Loup et l'Agneau", right:"Een wolf verzint redenen om een lam op te eten."},
          {left:"Le Renard et les Raisins", right:"Een vos kan niet bij de druiven en zegt: 'ze zijn toch zuur'."},
          {left:"Le Corbeau et le Renard", right:"Een vos vleit een raaf om diens kaas te krijgen."}
        ]
      },
      {
        type:"reflect", title:"Reflectievragen",
        intro:"Denk na en schrijf jouw antwoorden op. Deze worden bewaard in je portfolio.",
        questions:[
          "Welke fabel vond jij tot nu toe het interessantst, en waarom?",
          "Welke menselijke eigenschap herken je zelf in een van de fabeldieren?",
          "Waarom gebruikt La Fontaine juist dieren en niet gewoon mensen, denk je?"
        ]
      }
    ]
  },

  /* ================= HOOFDSTUK 5 ================= */
  {
    id:"ch5", num:5, badge:"b5",
    title:"Schrijf je eigen fabel",
    subtitle:"Creatief schrijven in het Frans",
    emoji:"🖋️",
    goal:"Schrijf je eigen fabel en pas Franse taal toe.",
    steps:[
      {
        type:"narrative", title:"Deviens fabuliste!",
        jean:[
          "De grote dag is aangebroken: jij wordt <strong>fabelschrijver</strong>! Volg mijn stappenplan, gebruik de inspiratiekaarten en de Franse woordenschat.",
          "Je hoeft geen perfect Frans te schrijven — durf te proberen! Elke echte fabuliste begint met oefenen. Allez, à la plume!"
        ],
        readText:`<p class="read-label">📜 <em>La Fontaine — Dédicace des Fables au Dauphin (1668, opdracht aan de kroonprins)</em></p>
<blockquote class="read-quote">
  « Je me <span class="tt" data-tip="ik gebruik / I make use of">sers</span> d'<span class="tt" data-tip="dieren / animals">animaux</span> pour <span class="tt" data-tip="onderwijzen / instruct">instruire</span> les <span class="tt" data-tip="mensen / men">hommes</span>.<br>
  Ces <span class="tt" data-tip="fabels / fables">fables</span> ne sont pas seulement <span class="tt" data-tip="aangenaam, leuk / pleasant">agréables</span> ;<br>
  Elles <span class="tt" data-tip="bevatten / contain">contiennent</span> des <span class="tt" data-tip="lessen / lessons">leçons</span> <span class="tt" data-tip="nuttige / useful">utiles</span> pour la <span class="tt" data-tip="het leven / life">vie</span>. »
</blockquote>
<p class="read-trans">→ Ik gebruik dieren om mensen te onderwijzen. Mijn fabels zijn niet alleen leuk — ze bevatten nuttige lessen voor het leven.</p>`,
        readTextSimple:`<p class="read-label">📜 <em>La Fontaine over zijn eigen fabels — vereenvoudigd</em></p>
<p class="read-simple-text">La Fontaine schrijft dit aan de kroonprins van Frankrijk. Hij zegt: mijn verhalen over dieren zijn niet zomaar grappige verhalen. Ze leren mensen iets echts over het leven. Nu ga jij ook zo'n verhaal schrijven!</p>`,
        check:[
          {v:"Aan wie droeg La Fontaine zijn Fables op?",
           options:["Aan de gewone burgers van Parijs","Aan de Dauphin (de kroonprins van Frankrijk)","Aan zijn leraren","Aan Ésope (Aesopus)"], correct:1},
          {v:"Waarom gebruikt La Fontaine dieren in zijn verhalen?",
           options:["Puur voor de lol","Om mensen iets te leren over het leven via grappige verhalen","Omdat dieren makkelijker te tekenen zijn","Om de koning te prijzen"], correct:1}
        ]
      },
      { type:"writer", title:"De werkplaats — Bouw je fabel" },
      { type:"commission", title:"La Commission Royale — ontdek hoe jouw fabel wordt beoordeeld" },
      {
        type:"peertip",
        title:"Tip voor een klasgenoot",
        intro:"Je hebt zelf een fabel geschreven. Schrijf nu één tip voor een klasgenoot die nog moet beginnen. Wat heeft jou geholpen?",
        prompt:"Mijn tip voor het schrijven van een fabel:",
        placeholder:"Bijv: Begin met het kiezen van je dieren, dan wordt de moraal vanzelf duidelijk..."
      }
    ]
  },

  /* ================= HOOFDSTUK 6 ================= */
  {
    id:"ch6", num:6, badge:"b6",
    title:"Publicatie en reflectie",
    subtitle:"Presenteer en kijk terug",
    emoji:"🏛️",
    goal:"Presenteer je eindproduct en reflecteer op je leerreis.",
    steps:[
      {
        type:"narrative", title:"Le grand final",
        jean:[
          "Wat ben ik trots op je! Je hebt de hele reis afgelegd. Nu is het tijd om je werk te <strong>publiceren</strong> en terug te kijken.",
          "Kies hoe je je fabel presenteert, vul je zelfevaluatie in en verdien het eindcertificaat: <strong>Meester van de Moraal</strong>."
        ],
        readText:`<p class="read-label">📜 <em>La Fontaine — Fables VI, 10 : Le Lièvre et la Tortue (1668, moraal)</em></p>
<blockquote class="read-quote">
  « <span class="tt" data-tip="niets / nothing">Rien</span> ne <span class="tt" data-tip="dient / serves">sert</span> de <span class="tt" data-tip="rennen / to run">courir</span> ; il <span class="tt" data-tip="het is nodig / it is necessary">faut</span> <span class="tt" data-tip="vertrekken / to set off">partir</span> à <span class="tt" data-tip="op het juiste moment / at the right moment">point</span>.<br>
  Le <span class="tt" data-tip="haas / hare">Lièvre</span> et la <span class="tt" data-tip="schildpad / tortoise">Tortue</span> en sont un <span class="tt" data-tip="betrouwbaar bewijs / reliable proof">témoin</span> <span class="tt" data-tip="zeker, betrouwbaar / reliable">garant</span>. »
</blockquote>
<p class="read-trans">→ Het heeft geen zin te rennen; je moet op het juiste moment vertrekken. De haas en de schildpad zijn het bewijs.</p>`,
        readTextSimple:`<p class="read-label">📜 <em>Le Lièvre et la Tortue — de moraal vereenvoudigd</em></p>
<p class="read-simple-text">Snel zijn is niet genoeg. De schildpad won van de haas — niet omdat ze sneller was, maar omdat ze niet stopte. Volhouden en op het juiste moment beginnen: dat is de les van La Fontaine. En dat geldt ook voor jou, na deze hele leerreis!</p>`,
        check:[
          {v:"Wat is de moraal van Le Lièvre et la Tortue (De haas en de schildpad)?",
           options:["Wie het snelst is, wint altijd","Het heeft geen zin te rennen; je moet op het juiste moment vertrekken","De schildpad is slimmer dan de haas","Je moet altijd vroeg opstaan"], correct:1},
          {v:"Welke eigenschap hielp de schildpad om van de haas te winnen?",
           options:["Haar snelheid","Haar volharding en doorzettingsvermogen","Haar list en sluwheid","Haar kracht"], correct:1}
        ]
      },
      { type:"product", title:"Publicatie — Kies & upload je eindproduct" },
      {
        type:"reflect", title:"Zelfevaluatie & reflectie",
        intro:"Kijk eerlijk terug op je leerreis. Je antwoorden komen in je portfolio.",
        questions:[
          "Wat heb je geleerd over Jean de La Fontaine en de fabel?",
          "Waar ben je het meest trots op in je eigen fabel?",
          "Wat vond je het lastigst, en hoe heb je dat opgelost?",
          "Welk cijfer zou je jezelf geven voor deze leerreis, en waarom?"
        ]
      },
      { type:"certificate", title:"Je eindcertificaat" }
    ]
  }
];
