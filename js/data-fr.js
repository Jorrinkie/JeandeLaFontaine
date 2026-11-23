/* =========================================================
   FRANSE TAALDATA — Banque de mots, Banque de phrases,
   voorbeeldfabels en vidéothèque-categorieën.
   Doel: leerlingen genoeg Frans geven om zelf een fabel te schrijven.
   ========================================================= */

/* ---------- BANQUE DE MOTS (fr + nl) ---------- */
const VOCAB = {
  animaux: { label:"Dieren", labelFr:"Les animaux", icon:"🦊", words:[
    {fr:"le renard", nl:"de vos", emoji:"🦊"},
    {fr:"le corbeau", nl:"de raaf", emoji:"🐦‍⬛"},
    {fr:"le lion", nl:"de leeuw", emoji:"🦁"},
    {fr:"la tortue", nl:"de schildpad", emoji:"🐢"},
    {fr:"le lièvre", nl:"de haas", emoji:"🐇"},
    {fr:"la fourmi", nl:"de mier", emoji:"🐜"},
    {fr:"la cigale", nl:"de krekel", emoji:"🦗"},
    {fr:"le loup", nl:"de wolf", emoji:"🐺"},
    {fr:"l'agneau", nl:"het lam", emoji:"🐑"},
    {fr:"le rat", nl:"de rat", emoji:"🐀"},
    {fr:"la souris", nl:"de muis", emoji:"🐭"},
    {fr:"le hibou", nl:"de uil", emoji:"🦉"},
    {fr:"le chat", nl:"de kat", emoji:"🐱"},
    {fr:"le chien", nl:"de hond", emoji:"🐶"},
    {fr:"l'oiseau", nl:"de vogel", emoji:"🐦"},
    {fr:"la grenouille", nl:"de kikker", emoji:"🐸"}
  ]},
  caractere: { label:"Eigenschappen", labelFr:"Le caractère", icon:"🎭", words:[
    {fr:"rusé", nl:"sluw"},
    {fr:"fier", nl:"trots"},
    {fr:"patient", nl:"geduldig"},
    {fr:"paresseux", nl:"lui"},
    {fr:"travailleur", nl:"vlijtig / hardwerkend"},
    {fr:"orgueilleux", nl:"hoogmoedig"},
    {fr:"sage", nl:"wijs"},
    {fr:"gentil", nl:"aardig"},
    {fr:"méchant", nl:"gemeen"},
    {fr:"courageux", nl:"moedig"},
    {fr:"peureux", nl:"bang / angstig"},
    {fr:"malin", nl:"slim"},
    {fr:"vaniteux", nl:"ijdel"},
    {fr:"avare", nl:"gierig"},
    {fr:"généreux", nl:"vrijgevig"},
    {fr:"lent", nl:"traag / langzaam"},
    {fr:"rapide", nl:"snel"},
    {fr:"fort", nl:"sterk"},
    {fr:"faible", nl:"zwak"}
  ]},
  emotions: { label:"Emoties", labelFr:"Les émotions", icon:"😊", words:[
    {fr:"heureux", nl:"blij / gelukkig"},
    {fr:"triste", nl:"verdrietig"},
    {fr:"en colère", nl:"boos"},
    {fr:"surpris", nl:"verrast"},
    {fr:"effrayé", nl:"bang"},
    {fr:"jaloux", nl:"jaloers"},
    {fr:"déçu", nl:"teleurgesteld"},
    {fr:"content", nl:"tevreden"},
    {fr:"fatigué", nl:"moe"},
    {fr:"affamé", nl:"uitgehongerd"}
  ]},
  verbes: { label:"Werkwoorden", labelFr:"Les verbes", icon:"⚡", words:[
    {fr:"courir", nl:"rennen"},
    {fr:"manger", nl:"eten"},
    {fr:"parler", nl:"praten"},
    {fr:"chanter", nl:"zingen"},
    {fr:"marcher", nl:"lopen"},
    {fr:"tomber", nl:"vallen"},
    {fr:"aider", nl:"helpen"},
    {fr:"tromper", nl:"bedriegen"},
    {fr:"gagner", nl:"winnen"},
    {fr:"perdre", nl:"verliezen"},
    {fr:"écouter", nl:"luisteren"},
    {fr:"regarder", nl:"kijken"},
    {fr:"dire", nl:"zeggen"},
    {fr:"voir", nl:"zien"},
    {fr:"prendre", nl:"pakken / nemen"},
    {fr:"donner", nl:"geven"},
    {fr:"travailler", nl:"werken"},
    {fr:"dormir", nl:"slapen"},
    {fr:"rire", nl:"lachen"},
    {fr:"pleurer", nl:"huilen"}
  ]},
  lieux: { label:"Plaatsen", labelFr:"Les lieux", icon:"🌳", words:[
    {fr:"dans la forêt", nl:"in het bos"},
    {fr:"dans le jardin", nl:"in de tuin"},
    {fr:"au bord de la rivière", nl:"aan de rivier"},
    {fr:"sur la branche", nl:"op de tak"},
    {fr:"dans le château", nl:"in het kasteel"},
    {fr:"à la campagne", nl:"op het platteland"},
    {fr:"sous l'arbre", nl:"onder de boom"},
    {fr:"dans le pré", nl:"in de wei"},
    {fr:"à la ferme", nl:"op de boerderij"},
    {fr:"dans la maison", nl:"in het huis"}
  ]},
  connecteurs: { label:"Verbindingswoorden", labelFr:"Les connecteurs", icon:"🔗", words:[
    {fr:"et", nl:"en"},
    {fr:"mais", nl:"maar"},
    {fr:"puis", nl:"daarna"},
    {fr:"alors", nl:"dus / toen"},
    {fr:"parce que", nl:"omdat"},
    {fr:"quand", nl:"wanneer / toen"},
    {fr:"soudain", nl:"plotseling"},
    {fr:"enfin", nl:"eindelijk"},
    {fr:"d'abord", nl:"eerst"},
    {fr:"ensuite", nl:"vervolgens"},
    {fr:"car", nl:"want"},
    {fr:"donc", nl:"dus"}
  ]},
  morales: { label:"Moralen", labelFr:"Les morales", icon:"💡", words:[
    {fr:"Il ne faut pas écouter les flatteurs.", nl:"Je moet niet naar vleiers luisteren."},
    {fr:"Rien ne sert de courir ; il faut partir à point.", nl:"Hard rennen heeft geen zin; vertrek op tijd."},
    {fr:"On a souvent besoin d'un plus petit que soi.", nl:"Je hebt vaak iemand nodig die kleiner is dan jij."},
    {fr:"Il faut travailler avant de s'amuser.", nl:"Eerst werken, dan pas genieten."},
    {fr:"La raison du plus fort est toujours la meilleure.", nl:"Het recht van de sterkste geldt altijd."},
    {fr:"Petit à petit, on va loin.", nl:"Beetje bij beetje kom je ver."}
  ]}
};

/* ---------- BANQUE DE PHRASES ---------- */
const PHRASES = [
  {cat:"Begin", fr:"Il était une fois...", nl:"Er was eens..."},
  {cat:"Begin", fr:"Un jour,...", nl:"Op een dag,..."},
  {cat:"Begin", fr:"Dans la forêt vivait...", nl:"In het bos woonde..."},
  {cat:"Vervolg", fr:"Puis,...", nl:"Daarna,..."},
  {cat:"Vervolg", fr:"Ensuite,...", nl:"Vervolgens,..."},
  {cat:"Vervolg", fr:"Alors,...", nl:"Toen / Dus,..."},
  {cat:"Spanning", fr:"Soudain,...", nl:"Plotseling,..."},
  {cat:"Spanning", fr:"Tout à coup,...", nl:"Opeens,..."},
  {cat:"Spanning", fr:"Mais...", nl:"Maar..."},
  {cat:"Dialoog", fr:"« Bonjour ! » dit le renard.", nl:"« Goedendag! » zei de vos."},
  {cat:"Dialoog", fr:"« Aide-moi, s'il te plaît. »", nl:"« Help me alsjeblieft. »"},
  {cat:"Dialoog", fr:"Il/Elle répond : « ... »", nl:"Hij/Zij antwoordt: « ... »"},
  {cat:"Einde", fr:"Finalement,...", nl:"Uiteindelijk,..."},
  {cat:"Einde", fr:"À la fin,...", nl:"Aan het einde,..."},
  {cat:"Moraal", fr:"La morale de cette histoire est : ...", nl:"De moraal van dit verhaal is: ..."},
  {cat:"Moraal", fr:"Cette fable nous apprend que...", nl:"Deze fabel leert ons dat..."}
];

/* ---------- VOORBEELDFABELS (vereenvoudigd Frans, havo 2/3) ---------- */
const FABLES = [
  {
    id:"corbeau", titleFr:"Le Corbeau et le Renard", titleNl:"De raaf en de vos",
    img:"img/fablesboek.jpg", emoji:"🦊", level:"A1",
    animals:["le corbeau","le renard"],
    lines:[
      {fr:"Un corbeau est assis sur un arbre.", w:[["corbeau","raaf"],["arbre","boom"]]},
      {fr:"Il tient un fromage dans son bec.", w:[["tient","houdt vast"],["fromage","kaas"],["bec","snavel"]]},
      {fr:"Un renard arrive. Il a très faim.", w:[["renard","vos"],["faim","honger"]]},
      {fr:"« Bonjour ! Comme vous êtes beau ! » dit le renard.", w:[["beau","mooi"]]},
      {fr:"« Votre voix est sûrement très belle aussi. »", w:[["voix","stem"],["sûrement","vast en zeker"]]},
      {fr:"Le corbeau est fier. Il ouvre le bec pour chanter.", w:[["fier","trots"],["ouvre","opent"],["chanter","zingen"]]},
      {fr:"Le fromage tombe. Le renard le prend et part.", w:[["tombe","valt"],["prend","pakt"],["part","gaat weg"]]}
    ],
    linesSimple:[
      {fr:"Un grand oiseau noir — un corbeau — est dans un arbre.", w:[["corbeau","raaf"],["arbre","boom"]]},
      {fr:"Il a un fromage dans la bouche.", w:[["fromage","kaas"],["bouche","mond/snavel"]]},
      {fr:"Un renard voit le fromage. Il a faim.", w:[["renard","vos"],["faim","honger"]]},
      {fr:"Il dit : « Tu es très beau ! Chante pour moi ! »", w:[["beau","mooi"],["chante","zing"]]},
      {fr:"Le corbeau est content. Il ouvre la bouche pour chanter.", w:[["content","blij"],["ouvre","opent"]]},
      {fr:"Le fromage tombe. Le renard prend le fromage et part.", w:[["tombe","valt"],["prend","pakt"]]}
    ],
    predict:{
      scenario:"Een grote zwarte vogel — een raaf — zit hoog in een boom. Hij heeft een stuk kaas in zijn snavel. Een slimme vos ziet hem en wil die kaas hebben. De vos heeft geen kaas, en hij kan de raaf niet dwingen.",
      v:"Hoe denk jij dat de vos de kaas zal krijgen? Wat zal hij doen of zeggen?"
    },
    moral:{fr:"Il ne faut pas écouter les flatteurs.", nl:"Je moet niet naar vleiers luisteren."},
    quiz:[
      {q:"Wat heeft de raaf in zijn snavel?", options:["Een kaas (un fromage)","Een worm","Een tak","Een steen"], answer:0, explain:"« un fromage » = een kaas."},
      {q:"Hoe krijgt de vos de kaas?", options:["Hij steelt hem","Hij vleit de raaf zodat die gaat zingen","Hij vraagt beleefd","Hij koopt hem"], answer:1, explain:"De vos vleit (flatte) de raaf; die opent zijn bek en de kaas valt."},
      {q:"Wat betekent 'la voix'?", options:["De stem","De boom","De honger","De kaas"], answer:0, explain:"« la voix » = de stem."}
    ],
    vocab:[["le corbeau","de raaf"],["le renard","de vos"],["le fromage","de kaas"],["le bec","de snavel"],["chanter","zingen"],["tomber","vallen"]]
  },
  {
    id:"lievre", titleFr:"Le Lièvre et la Tortue", titleNl:"De haas en de schildpad",
    img:"img/fable_lievre_tortue.jpg", emoji:"🐢", level:"A1",
    animals:["le lièvre","la tortue"],
    lines:[
      {fr:"Un lièvre court très vite.", w:[["lièvre","haas"],["court","rent"],["vite","snel"]]},
      {fr:"Une tortue marche très lentement.", w:[["tortue","schildpad"],["marche","loopt"],["lentement","langzaam"]]},
      {fr:"La tortue dit : « Je peux gagner la course ! »", w:[["gagner","winnen"],["course","race"]]},
      {fr:"Le lièvre rit et ils commencent la course.", w:[["rit","lacht"],["commencent","beginnen"]]},
      {fr:"Le lièvre court vite, puis il dort sous un arbre.", w:[["dort","slaapt"]]},
      {fr:"La tortue marche sans s'arrêter.", w:[["sans s'arrêter","zonder te stoppen"]]},
      {fr:"La tortue arrive la première ! Le lièvre a perdu.", w:[["première","eerste"],["a perdu","heeft verloren"]]}
    ],
    linesSimple:[
      {fr:"Il y a un lièvre très rapide et une tortue très lente.", w:[["lièvre","haas"],["tortue","schildpad"],["rapide","snel"],["lente","langzaam"]]},
      {fr:"La tortue dit : « Je peux gagner une course contre toi ! »", w:[["gagner","winnen"],["course","race"]]},
      {fr:"Le lièvre rit. Ils commencent la course.", w:[["rit","lacht"],["commencent","beginnen"]]},
      {fr:"Le lièvre est rapide. Il s'arrête pour dormir sous un arbre.", w:[["s'arrête","stopt"],["dormir","slapen"]]},
      {fr:"La tortue continue à marcher sans s'arrêter.", w:[["continue","gaat verder"],["marcher","lopen"]]},
      {fr:"La tortue arrive en premier ! Le lièvre a perdu.", w:[["en premier","als eerste"],["a perdu","heeft verloren"]]}
    ],
    predict:{
      scenario:"Een haas en een schildpad besluiten een race te houden. De haas is razendsnel en lacht de schildpad uit. De schildpad is heel langzaam — maar hij geeft nooit op.",
      v:"Wie wint de race, de haas of de schildpad? En waarom denk je dat?"
    },
    moral:{fr:"Rien ne sert de courir ; il faut partir à point.", nl:"Hard rennen heeft geen zin; je moet op tijd vertrekken."},
    quiz:[
      {q:"Wie wint de race?", options:["De schildpad (la tortue)","De haas (le lièvre)","Niemand","Ze eindigen gelijk"], answer:0, explain:"De volhardende tortue wint."},
      {q:"Waarom verliest de haas?", options:["Hij valt","Hij gaat slapen tijdens de race","Hij verdwaalt","Hij is ziek"], answer:1, explain:"Le lièvre dort (slaapt) onder een boom."},
      {q:"Wat betekent 'lentement'?", options:["Langzaam","Snel","Blij","Sterk"], answer:0, explain:"« lentement » = langzaam."}
    ],
    vocab:[["le lièvre","de haas"],["la tortue","de schildpad"],["courir","rennen"],["gagner","winnen"],["la course","de race"],["lentement","langzaam"]]
  },
  {
    id:"lion", titleFr:"Le Lion et le Rat", titleNl:"De leeuw en de rat",
    img:"img/fable_lion_rat.jpg", emoji:"🦁", level:"A1",
    animals:["le lion","le rat"],
    lines:[
      {fr:"Un petit rat joue près d'un grand lion.", w:[["rat","rat"],["près de","vlak bij"],["lion","leeuw"]]},
      {fr:"Le lion attrape le rat, mais il le laisse partir.", w:[["attrape","vangt"],["laisse partir","laat gaan"]]},
      {fr:"Un jour, le lion tombe dans un filet.", w:[["filet","net"]]},
      {fr:"Il ne peut pas bouger et il rugit très fort.", w:[["bouger","bewegen"],["rugit","brult"]]},
      {fr:"Le petit rat coupe le filet avec ses dents.", w:[["coupe","snijdt"],["dents","tanden"]]},
      {fr:"Le lion est libre ! « Merci, petit rat. »", w:[["libre","vrij"]]}
    ],
    linesSimple:[
      {fr:"Un petit rat joue à côté d'un grand lion.", w:[["rat","rat"],["lion","leeuw"],["grand","groot"]]},
      {fr:"Le lion attrape le rat. Mais il dit : « Va ! Je te laisse partir. »", w:[["attrape","vangt"],["laisse partir","laat gaan"]]},
      {fr:"Un jour, le lion tombe dans un grand filet.", w:[["filet","net"]]},
      {fr:"Il ne peut pas bouger. Il crie très fort.", w:[["bouger","bewegen"],["crie","roept/schreeuwt"]]},
      {fr:"Le petit rat arrive et coupe le filet avec ses dents.", w:[["coupe","snijdt"],["dents","tanden"]]},
      {fr:"Le lion est libre ! Il dit merci au petit rat.", w:[["libre","vrij"]]}
    ],
    predict:{
      scenario:"Een grote machtige leeuw vangt een piepklein rattje. Hij zou hem zo kunnen opeten. Maar hij besluit hem vrij te laten. Later raakt de leeuw zelf in een groot net gevangen.",
      v:"Denk je dat zo'n kleine rat echt een grote leeuw kan helpen? Hoe zou dat kunnen?"
    },
    moral:{fr:"On a souvent besoin d'un plus petit que soi.", nl:"Je hebt vaak iemand nodig die kleiner is dan jij."},
    quiz:[
      {q:"Wat doet de leeuw eerst met de rat?", options:["Hij laat hem gaan","Hij eet hem op","Hij negeert hem","Hij jaagt hem weg"], answer:0, explain:"Le lion laisse partir le rat (laat hem gaan)."},
      {q:"Hoe redt de rat de leeuw?", options:["Hij roept om hulp","Hij snijdt het net kapot met zijn tanden","Hij haalt water","Hij verstopt hem"], answer:1, explain:"Le rat coupe le filet avec ses dents."},
      {q:"Wat betekent 'libre'?", options:["Vrij","Sterk","Bang","Moe"], answer:0, explain:"« libre » = vrij."}
    ],
    vocab:[["le lion","de leeuw"],["le rat","de rat"],["le filet","het net"],["aider","helpen"],["libre","vrij"],["les dents","de tanden"]]
  },
  {
    id:"cigale", titleFr:"La Cigale et la Fourmi", titleNl:"De krekel en de mier",
    img:"img/fable_cigale_fourmi.jpg", emoji:"🐜", level:"A1",
    animals:["la cigale","la fourmi"],
    lines:[
      {fr:"La cigale chante tout l'été.", w:[["cigale","krekel"],["chante","zingt"],["été","zomer"]]},
      {fr:"La fourmi travaille et garde de la nourriture.", w:[["fourmi","mier"],["travaille","werkt"],["nourriture","voedsel"]]},
      {fr:"L'hiver arrive. La cigale a froid et faim.", w:[["hiver","winter"],["froid","koud"],["faim","honger"]]},
      {fr:"Elle va chez la fourmi : « Donne-moi à manger, s'il te plaît. »", w:[["donne","geef"],["manger","eten"]]},
      {fr:"« Que faisais-tu cet été ? » demande la fourmi.", w:[["faisais-tu","deed je"]]},
      {fr:"« Je chantais. » — « Tu chantais ? Eh bien, danse maintenant ! »", w:[["chantais","zong"],["danse","dans"]]}
    ],
    linesSimple:[
      {fr:"La cigale chante toute la journée en été.", w:[["cigale","krekel"],["chante","zingt"],["été","zomer"]]},
      {fr:"La fourmi travaille et garde de la nourriture pour l'hiver.", w:[["fourmi","mier"],["nourriture","voedsel"],["hiver","winter"]]},
      {fr:"L'hiver arrive. La cigale a faim et froid.", w:[["faim","honger"],["froid","koud"]]},
      {fr:"La cigale va chez la fourmi et dit : « Aide-moi, s'il te plaît ! »", w:[["aide","help"]]},
      {fr:"La fourmi dit : « Tu chantais cet été ? Alors danse maintenant ! »", w:[["chantais","zong"],["danse","dans"]]},
      {fr:"La cigale comprend : il faut travailler avant de jouer.", w:[["comprend","begrijpt"]]}
    ],
    predict:{
      scenario:"Een krekel zingt en danst de hele zomer. Een mier werkt hard en spaart eten op voor de winter. De zomer is voorbij, de winter komt — en de krekel heeft niets.",
      v:"Zal de mier de krekel helpen? Wat zou jij doen als jij de mier was?"
    },
    moral:{fr:"Il faut travailler avant de s'amuser.", nl:"Eerst werken, dan pas genieten."},
    quiz:[
      {q:"Wat doet de krekel de hele zomer?", options:["Zingen","Werken","Slapen","Sparen"], answer:0, explain:"La cigale chante tout l'été."},
      {q:"Waarom helpt de mier niet?", options:["Ze is boos zonder reden","De krekel heeft niet gewerkt of gespaard","Ze heeft zelf niets","Ze houdt niet van muziek"], answer:1, explain:"De fourmi werkte terwijl de cigale zong."},
      {q:"Wat betekent 'l'hiver'?", options:["De winter","De zomer","Het voedsel","De honger"], answer:0, explain:"« l'hiver » = de winter."}
    ],
    vocab:[["la cigale","de krekel"],["la fourmi","de mier"],["l'été","de zomer"],["l'hiver","de winter"],["travailler","werken"],["la nourriture","het voedsel"]],
    challenge:[
      {q:"Welke menselijke fout laat de krekel zien?", options:["Kortetermijndenken (niet vooruitkijken)","Vooruitdenken","Vrijgevigheid","Moed"], answer:0, explain:"De krekel denkt niet aan later — kortetermijndenken."}
    ]
  },
  {
    id:"loup", titleFr:"Le Loup et l'Agneau", titleNl:"De wolf en het lam",
    img:"img/fable_loup_agneau.jpg", emoji:"🐺", level:"A2",
    animals:["le loup","l'agneau"],
    lines:[
      {fr:"Un agneau boit l'eau d'une rivière tranquille.", w:[["agneau","lam"],["boit","drinkt"],["rivière","rivier"]]},
      {fr:"Un loup affamé arrive et cherche une raison de se disputer.", w:[["affamé","uitgehongerd"],["se disputer","ruzie maken"]]},
      {fr:"« Tu salis mon eau ! » dit le loup avec colère.", w:[["salis","maakt vuil"],["colère","woede"]]},
      {fr:"« Mais je bois plus bas que vous », répond l'agneau poliment.", w:[["plus bas","lager"],["poliment","beleefd"]]},
      {fr:"« Alors c'est ton frère ! » — « Je n'ai pas de frère, monsieur. »", w:[["le frère","de broer"]]},
      {fr:"Sans écouter, le loup emporte l'agneau dans la forêt.", w:[["sans écouter","zonder te luisteren"],["emporte","neemt mee"]]}
    ],
    linesSimple:[
      {fr:"Un petit agneau boit de l'eau au bord d'une rivière.", w:[["agneau","lam"],["boit","drinkt"],["rivière","rivier"]]},
      {fr:"Un grand loup arrive. Il veut manger l'agneau.", w:[["loup","wolf"],["veut","wil"]]},
      {fr:"Le loup dit : « Tu salis mon eau ! »", w:[["salis","maakt vuil"]]},
      {fr:"L'agneau dit : « Non ! Je bois plus bas que toi. »", w:[["plus bas","lager"]]},
      {fr:"Le loup cherche d'autres raisons. L'agneau répond poliment.", w:[["cherche","zoekt"],["poliment","beleefd"]]},
      {fr:"Le loup ne l'écoute pas. Il prend l'agneau et s'en va.", w:[["n'écoute pas","luistert niet"]]}
    ],
    predict:{
      scenario:"Een grote wolf wil een klein lam opeten. Hij bedenkt steeds een nieuwe beschuldiging. Het lam legt iedere keer rustig en beleefd uit waarom de wolf ongelijk heeft.",
      v:"Denk je dat de wolf luistert naar het lam? Wat gebeurt er aan het einde?"
    },
    moral:{fr:"La raison du plus fort est toujours la meilleure.", nl:"Het recht van de sterkste geldt altijd."},
    quiz:[
      {q:"Waarom blijft de wolf nieuwe redenen zoeken?", options:["Hij wil vrienden worden","Hij zoekt een excuus om het lam op te eten","Hij heeft dorst","Hij is verdwaald"], answer:1, explain:"De wolf verzint smoezen; hij wil gewoon een reden om het lam te pakken."},
      {q:"Wat betekent « se disputer »?", options:["Ruzie maken","Zwemmen","Slapen","Zingen"], answer:0, explain:"« se disputer » = ruzie maken."},
      {q:"Wat leert deze fabel over macht?", options:["De sterkste krijgt altijd gelijk, ook onterecht","Wees altijd beleefd","Drink schoon water","Deel je eten"], answer:0, explain:"La raison du plus fort — de sterkste wint, ook al heeft hij ongelijk."}
    ],
    challenge:[
      {q:"« La raison du plus fort est toujours la meilleure. » Wat bekritiseert La Fontaine hiermee?", options:["Machtsmisbruik van de sterken tegenover de zwakken","De regen","De landbouw","De rivier"], answer:0, explain:"Hij bekritiseert hoe machtigen hun zin doordrijven ten koste van zwakkeren."},
      {q:"Welk woord past het best bij « l'agneau »?", options:["innocent (onschuldig)","cruel (wreed)","riche (rijk)","méchant (gemeen)"], answer:0, explain:"Het lam is « innocent » — onschuldig."}
    ],
    vocab:[["le loup","de wolf"],["l'agneau","het lam"],["la rivière","de rivier"],["se disputer","ruzie maken"],["la colère","de woede"],["fort","sterk"]]
  },
  {
    id:"raisins", titleFr:"Le Renard et les Raisins", titleNl:"De vos en de druiven",
    img:"img/fable_renard_raisins.jpg", emoji:"🍇", level:"A2",
    animals:["le renard"],
    lines:[
      {fr:"Un renard affamé voit de beaux raisins bien mûrs.", w:[["raisins","druiven"],["mûrs","rijp"]]},
      {fr:"Ils pendent très haut sur une branche.", w:[["pendent","hangen"],["haut","hoog"]]},
      {fr:"Le renard saute, saute encore, mais n'arrive pas à les attraper.", w:[["saute","springt"],["attraper","pakken"]]},
      {fr:"Fatigué, il abandonne enfin.", w:[["fatigué","moe"],["abandonne","geeft op"]]},
      {fr:"« Ils sont trop verts ! Ils ne sont bons que pour les idiots. »", w:[["verts","onrijp / groen"],["ne...que","alleen maar"]]}
    ],
    linesSimple:[
      {fr:"Un renard a très faim. Il voit des raisins dans un arbre.", w:[["raisins","druiven"],["arbre","boom"]]},
      {fr:"Les raisins sont beaux. Mais ils sont très hauts.", w:[["beaux","mooi"],["hauts","hoog"]]},
      {fr:"Le renard saute. Une fois, deux fois, trois fois.", w:[["saute","springt"]]},
      {fr:"Il ne peut pas attraper les raisins. Il est fatigué.", w:[["attraper","pakken"],["fatigué","moe"]]},
      {fr:"Il dit : « Ces raisins ne sont pas bons. Ils sont trop verts. »", w:[["verts","onrijp/groen"]]},
      {fr:"Mais c'est un mensonge — il dit ça parce qu'il ne peut pas les avoir.", w:[["mensonge","leugen"]]}
    ],
    predict:{
      scenario:"Een hongerige vos ziet prachtige rijpe druiven hoog in een boom. Hij springt keer op keer, maar de druiven hangen te hoog. Na een tijdje geeft hij het op.",
      v:"Wat zal de vos zeggen om zijn mislukking goed te praten?"
    },
    moral:{fr:"Il est facile de mépriser ce qu'on ne peut pas avoir.", nl:"Het is makkelijk te minachten wat je niet kunt krijgen."},
    quiz:[
      {q:"Waarom krijgt de vos de druiven niet?", options:["Ze hangen te hoog","Ze zijn giftig","Ze zijn al weg","Iemand bewaakt ze"], answer:0, explain:"Ils pendent très haut — ze hangen te hoog."},
      {q:"Wat zegt de vos als het niet lukt?", options:["Dat de druiven toch te zuur/onrijp zijn","Dat hij morgen terugkomt","Dat hij hulp gaat halen","Dat hij geen honger heeft"], answer:0, explain:"Hij praat zijn mislukking goed: 'ze zijn toch te groen'."},
      {q:"Wat betekent « mépriser »?", options:["Minachten","Kopen","Plukken","Delen"], answer:0, explain:"« mépriser » = minachten."}
    ],
    challenge:[
      {q:"Welke menselijke reactie toont de vos?", options:["Iets afkraken wat je niet kunt krijgen","Hard doorwerken","Eerlijk toegeven","Om hulp vragen"], answer:0, explain:"De vos kleineert wat hij niet kan bereiken — een bekende uitvlucht."},
      {q:"« Ils ne sont bons que pour les idiots. » Wat betekent « ne...que » hier?", options:["alleen maar / slechts","nooit","altijd","bijna"], answer:0, explain:"« ne...que » = alleen maar / slechts."}
    ],
    vocab:[["le renard","de vos"],["le raisin","de druif"],["mûr","rijp"],["sauter","springen"],["attraper","pakken"],["mépriser","minachten"]]
  },
  {
    id:"chene", titleFr:"Le Chêne et le Roseau", titleNl:"De eik en het riet",
    img:"img/fable_chene_roseau.jpg", emoji:"🌳", level:"B1",
    animals:["le chêne","le roseau"],
    lines:[
      {fr:"Un chêne immense se moque d'un petit roseau.", w:[["chêne","eik"],["se moque","lacht uit"],["roseau","riet"]]},
      {fr:"« Tu plies au moindre vent, tandis que moi, je reste droit. »", w:[["plies","buigt"],["au moindre vent","bij het minste windje"],["tandis que","terwijl"],["droit","recht"]]},
      {fr:"Le roseau répond : « Je plie, mais je ne casse pas. »", w:[["casse","breek"]]},
      {fr:"Soudain, une tempête violente se lève.", w:[["tempête","storm"],["se lève","steekt op"]]},
      {fr:"Le roseau se courbe jusqu'au sol et survit.", w:[["se courbe","buigt"],["survit","overleeft"]]},
      {fr:"Le chêne, trop fier et rigide, est arraché par le vent.", w:[["rigide","stijf"],["arraché","ontworteld"]]}
    ],
    linesSimple:[
      {fr:"Il y a un grand chêne (arbre) et un petit roseau (plante).", w:[["chêne","eik"],["roseau","riet"]]},
      {fr:"Le chêne dit : « Tu es faible — tu bouges à chaque vent. »", w:[["faible","zwak"],["bouges","beweeg je"]]},
      {fr:"Le roseau dit : « Je plie, mais je ne casse pas. »", w:[["plie","buig"],["casse","breek"]]},
      {fr:"Un jour, une grande tempête arrive.", w:[["tempête","storm"]]},
      {fr:"Le roseau plie avec le vent. Il survit.", w:[["survit","overleeft"]]},
      {fr:"Le chêne ne peut pas plier. Il tombe. Il est cassé.", w:[["tombe","valt"],["cassé","gebroken"]]}
    ],
    predict:{
      scenario:"Een grote sterke eik lacht een klein buigzaam rietje uit: 'Jij buigt bij het minste windje, ik sta altijd recht!' Dan steekt er een geweldige storm op.",
      v:"Wie overleeft de storm — de sterke starre eik of het kleine buigzame rietje?"
    },
    moral:{fr:"Mieux vaut plier que rompre.", nl:"Beter buigen dan breken."},
    quiz:[
      {q:"Waarom lacht de eik het riet uit?", options:["Omdat het riet bij elk windje buigt","Omdat het riet groen is","Omdat het riet groot is","Omdat het riet praat"], answer:0, explain:"De eik vindt zichzelf sterk omdat hij recht blijft staan."},
      {q:"Wat overkomt de eik in de storm?", options:["Hij wordt ontworteld","Hij buigt soepel mee","Hij groeit harder","Er gebeurt niets"], answer:0, explain:"Te stijf en te trots → hij wordt ontworteld."},
      {q:"Wat betekent « plier »?", options:["Buigen","Breken","Groeien","Vallen"], answer:0, explain:"« plier » = buigen."}
    ],
    challenge:[
      {q:"Waar staan de eik en het riet symbolisch voor?", options:["Starre trots tegenover soepele nederigheid","Zomer tegenover winter","Rijk tegenover arm","Snel tegenover traag"], answer:0, explain:"De eik = starre trots; het riet = buigzame nederigheid die overleeft."},
      {q:"« Mieux vaut plier que rompre. » Hoe pas je dit toe op mensen?", options:["Soms is meebuigen sterker dan koppig standhouden","Wees altijd hard","Geef nooit toe","Vermijd elk risico"], answer:0, explain:"Flexibel zijn kan je juist redden — beter buigen dan breken."},
      {q:"Wat betekent « tandis que »?", options:["terwijl (tegenstelling)","omdat","hoewel","zodat"], answer:0, explain:"« tandis que » = terwijl."}
    ],
    vocab:[["le chêne","de eik"],["le roseau","het riet"],["plier","buigen"],["la tempête","de storm"],["casser","breken"],["fier","trots"]]
  }
];

/* ---------- VIDÉOTHÈQUE — standaardcategorieën ---------- */
const VIDEO_CATEGORIES = [
  {id:"fables", label:"Fabelvideo's", desc:"Fabels van Jean de La Fontaine (verfilmd of voorgelezen).", icon:"🎬"},
  {id:"uitleg", label:"Uitlegvideo's", desc:"Uitleg over fabels, Frans en het schrijven.", icon:"🎓"},
  {id:"voorbeeld", label:"Voorbeeld-eindproducten", desc:"Voorbeelden van eindproducten ter inspiratie.", icon:"⭐"}
];

/* =========================================================
   IMMERSIEVE BELEVENISSEN — elk level een 3D-achtige ruimte
   uit echte foto's/schilderijen, met Jean als gids + opdrachten.
   Hotspot x/y = percentage over de afbeelding.
   ========================================================= */
const IMMERSIVE = {
  ch1: {
    title: "Het dorp van Jean", subtitle: "Château-Thierry · Hoofdstuk 1 · 360°",
    pano: "img/pano/plein.jpg",
    attribution: "Sfeer-360°: dorpsuitzicht (CC BY-SA) · foto's = echt Château-Thierry",
    guide: [
      "Bonjour, mon élève! Kijk uit over het land waar ik opgroeide — sleep met je muis om rond te kijken.",
      "Klik op de gloeiende plekken (❓): mijn stad, mijn huis en mijn leven. Maak de opdracht om verder te komen."
    ],
    hotspots: [
      { yaw: -30, pitch: -4, ico: "🏰", card: { title: "Château-Thierry", img: "img/chateauthierry.jpg", text: "Het stadje waar ik in <strong>1621</strong> werd geboren, met de oude <em>Porte Saint-Pierre</em>.", words: [["la ville", "de stad"], ["la porte", "de poort"]] } },
      { yaw: 25, pitch: -3, ico: "🏠", card: { title: "Mijn geboortehuis", img: "img/geboortehuis.jpg", text: "Nu een museum over mijn leven en mijn fabels. Ik studeerde eerst rechten (le droit).", words: [["la maison natale", "het geboortehuis"], ["le droit", "het recht (studie)"]] } },
      { yaw: 90, pitch: -3, ico: "🍇", card: { title: "De streek Champagne", img: "img/champagne.jpg", text: "De wijngaarden, bossen en dieren waar ik opgroeide — ze komen terug in mijn fabels.", words: [["la campagne", "het platteland"], ["la forêt", "het bos"]] } },
      { yaw: 160, pitch: -3, ico: "🏛️", card: { title: "De Académie française", img: "img/academie.jpg", text: "In <strong>1684</strong> werd ik lid — de hoogste eer voor een Frans schrijver.", words: [["l'Académie française", "de Franse Academie"], ["l'honneur", "de eer"]] } },
      { yaw: -120, pitch: -3, ico: "🗿", card: { title: "Voor altijd geëerd", img: "img/standbeeld.jpg", text: "Ik stierf in 1695, maar standbeelden en mijn fabels blijven. Merci, mon élève!", words: [["le monument", "het standbeeld"], ["la fable", "de fabel"]] } },
      { yaw: -70, pitch: 3, ico: "❓", type: "task", quiz: { q: "In welk jaar werd Jean geboren?", options: ["1621", "1521", "1715"], answer: 0, explain: "Juist! Jean werd geboren in 1621." } }
    ]
  },
  ch2: {
    title: "Het paleis van de Zonnekoning", subtitle: "Versailles · Hoofdstuk 2 · 360°",
    pano: "img/pano/tuin360.jpg",
    attribution: "Sfeer-360°: park (CC BY-SA) · zaal-foto's = echt Versailles",
    guide: [
      "Welkom in de tuinen van het hof, mon élève! Sleep met je muis om écht rond te kijken.",
      "Klik op de gloeiende plekken (❓): je ziet de échte zalen van Versailles én het leven van de gewone burger. Maak de opdracht om verder te komen."
    ],
    hotspots: [
      { yaw: -30, pitch: -4, ico: "🏛️", card: { title: "De Cour de Marbre", img: "img/versailles.jpg", text: "Het échte Château de Versailles, machtscentrum van Lodewijk XIV. Honderden hovelingen verdrongen zich hier.", words: [["le château", "het kasteel"], ["les courtisans", "de hovelingen"]] } },
      { yaw: 20, pitch: -3, ico: "🪞", card: { title: "De Spiegelzaal", img: "img/hall_of_mirrors.jpg", text: "357 spiegels weerkaatsen het kaarslicht. Hier ontving de koning ambassadeurs uit de hele wereld.", words: [["les glaces", "de spiegels"], ["le roi", "de koning"]] } },
      { yaw: 55, pitch: -1, ico: "👑", type: "character", name: "Lodewijk XIV (le Roi-Soleil)", img: "img/louis14.jpg", lines: [
        { text: "Ah, un jeune écrivain à ma cour ! Approchez, approchez.", lang: "fr-FR" },
        { text: "Wist je dat ik zelf danste in balletten voor mijn hof? Ik was in mijn jonge jaren een echte danser.", lang: "nl-NL" },
        { text: "J'aime la musique, la danse et les grandes fêtes qui durent toute la nuit.", lang: "fr-FR" },
        { text: "Alleen zijn ken ik bijna niet: van 's ochtends vroeg tot 's avonds laat zijn er altijd mensen om me heen.", lang: "nl-NL" },
        { text: "J'adore mes jardins et mes fontaines — je peux m'y promener pendant des heures.", lang: "fr-FR" }
      ] },
      { yaw: 80, pitch: -2, ico: "🛏️", card: { title: "De slaapkamer van de koning", img: "img/chambre_roi.jpg", text: "Elke ochtend het 'lever du roi': edelen keken toe hoe de koning opstond. Opstaan was een openbaar schouwspel.", words: [["la chambre", "de slaapkamer"], ["le lever", "het opstaan"]] } },
      { yaw: 150, pitch: -3, ico: "🌳", card: { title: "De tuinen", img: "img/jardins.jpg", text: "De eindeloze tuinen van André Le Nôtre. 's Avonds feesten, muziek en vuurwerk.", words: [["les jardins", "de tuinen"], ["la fontaine", "de fontein"]] } },
      { yaw: -120, pitch: -3, ico: "👩‍🌾", type: "character", name: "Een boerin (la paysanne)", img: "img/paysans.jpg", lines: [
        { text: "Bonjour... wij, de boeren, werken hard en betalen zware belasting voor al die pracht.", lang: "nl-NL" },
        { text: "La vie est dure ici, loin des ors du château.", lang: "fr-FR" },
        { text: "La Fontaine schreef ook over ons — de kleine mensen. Vergeet ons niet in je fabel.", lang: "nl-NL" }
      ] },
      { yaw: -70, pitch: 3, ico: "❓", type: "task", quiz: { q: "Wat betekent « la cour »?", options: ["Het hof (de adel rond de koning)", "De keuken", "De kerk"], answer: 0, explain: "Juist! « la cour » = het hof." } }
    ]
  },
  ch3: {
    title: "De wereld van de fabel", subtitle: "Het fabelbos · Hoofdstuk 3 · 360°",
    pano: "img/pano/bos360.jpg",
    attribution: "Echte 360°-foto — NRCS (publiek domein)",
    guide: [
      "Welkom in het fabelbos, mon élève! Sleep met je muis om écht rond te kijken — je staat midden in de natuur.",
      "Hier leven mijn fabeldieren. Vind ze (❓), leer hun Franse namen, en maak de opdracht om verder te komen."
    ],
    hotspots: [
      { yaw: -35, pitch: -6, ico: "🦊", type: "character", name: "Le renard (de vos)", emoji: "🦊", lines: [
        { text: "Tiens, tiens... un nouvel écrivain ! Je suis le renard, rusé comme personne.", lang: "fr-FR" },
        { text: "Onthoud dit woord: « rusé » — dat betekent sluw. En dat ben ik!", lang: "nl-NL" },
        { text: "Gebruik mij gerust in je eigen fabel. Un bon personnage, n'est-ce pas ?", lang: "fr-FR" }
      ] },
      { yaw: 25, pitch: -4, ico: "🐢", card: { title: "La tortue", text: "De schildpad is <strong>patient</strong> (geduldig) en wint van de haas.", words: [["la tortue", "de schildpad"], ["patient", "geduldig"]] } },
      { yaw: 95, pitch: -3, ico: "🦁", card: { title: "Le lion", text: "De leeuw is <strong>fort</strong> (sterk), maar wordt gered door een kleine rat.", words: [["le lion", "de leeuw"], ["fort", "sterk"]] } },
      { yaw: 170, pitch: -5, ico: "🐜", card: { title: "La fourmi", text: "De mier is <strong>travailleur</strong> (vlijtig) en spaart voor de winter.", words: [["la fourmi", "de mier"], ["travailler", "werken"]] } },
      { yaw: -110, pitch: -4, ico: "🦗", card: { title: "La cigale", text: "De krekel is <strong>paresseux</strong> (lui) en zingt de hele zomer.", words: [["la cigale", "de krekel"], ["chanter", "zingen"]] } },
      { yaw: -160, pitch: 2, ico: "❓", type: "task", quiz: { q: "Welk dier is 'rusé' (sluw)?", options: ["Le renard (de vos)", "La tortue (de schildpad)", "La fourmi (de mier)"], answer: 0, explain: "Juist! Le renard is rusé — sluw." } }
    ]
  },
  ch4: {
    title: "De schrijfwerkplaats", subtitle: "Het atelier · Hoofdstuk 4 · 360°",
    pano: "img/pano/bieb.jpg",
    attribution: "Sfeer-360°: bibliotheek (CC BY-SA) · inhoud = Jeans werk",
    guide: [
      "Welkom in mijn werkplaats vol boeken, mon élève! Sleep met je muis om rond te kijken.",
      "Op de planken liggen woordkaarten en voorbeeldfabels. Klik ze aan en maak de opdracht."
    ],
    hotspots: [
      { yaw: -30, pitch: -3, ico: "🃏", card: { title: "Woordkaarten", text: "Open de Banque de mots voor Franse woorden en zinnen.", words: [["le mot", "het woord"]], goto: "world_banque" } },
      { yaw: 30, pitch: -3, ico: "📚", card: { title: "Voorbeeldfabels", img: "img/fablesboek.jpg", text: "Lees en beluister mijn fabels als voorbeeld voor je eigen fabel.", words: [["la fable", "de fabel"]], goto: "fables" } },
      { yaw: 110, pitch: -3, ico: "✒️", card: { title: "Het schrijfatelier", text: "Bouw stap voor stap je eigen fabel met hulp.", words: [["écrire", "schrijven"], ["la plume", "de veer/pen"]], goto: "atelier" } },
      { yaw: -120, pitch: 3, ico: "❓", type: "task", quiz: { q: "Wat is « la plume »?", options: ["De veer/pen", "Het boek", "De tafel"], answer: 0, explain: "Juist! « la plume » = de veer/pen waarmee Jean schreef." } }
    ]
  },
  ch5: {
    title: "Schrijf je eigen fabel", subtitle: "Het schrijfatelier · Hoofdstuk 5 · 360°",
    pano: "img/pano/bieb.jpg",
    attribution: "Sfeer-360°: bibliotheek (CC BY-SA)",
    guide: [
      "De grote dag: jij wordt zelf fabelschrijver! Sleep om rond te kijken.",
      "Gebruik het schrijfatelier en de woordenbank. À la plume!"
    ],
    hotspots: [
      { yaw: 0, pitch: -3, ico: "✒️", card: { title: "Het schrijfatelier", text: "Bouw stap voor stap je eigen fabel — met voorbeeldwoorden en -zinnen.", words: [["écrire", "schrijven"], ["la plume", "de veer/pen"]], goto: "atelier" } },
      { yaw: 90, pitch: -3, ico: "🃏", card: { title: "Woordenbank", text: "Franse woorden en zinnen om je fabel mee te schrijven.", words: [["le mot", "het woord"]], goto: "world_banque" } },
      { yaw: -90, pitch: 3, ico: "❓", type: "task", quiz: { q: "Waarmee eindigt een goede fabel?", options: ["Met een moraal", "Met een lied", "Met een vraag"], answer: 0, explain: "Juist! Een fabel eindigt met een moraal." } }
    ]
  },
  ch6: {
    title: "Publicatie en reflectie", subtitle: "De grote finale · Hoofdstuk 6 · 360°",
    pano: "img/pano/zaal.jpg",
    attribution: "Sfeer-360°: grote zaal (CC BY-SA)",
    guide: [
      "Wat ben ik trots op je, mon élève! Kijk rond in deze plechtige zaal.",
      "Tijd om je werk te publiceren en het eindcertificaat te verdienen: Meester van de Moraal."
    ],
    hotspots: [
      { yaw: 0, pitch: -3, ico: "🏆", card: { title: "Je eindproduct", text: "Ga naar Hoofdstuk 6 om je fabel te publiceren en je certificaat te halen.", words: [["la publication", "de publicatie"]] } },
      { yaw: 100, pitch: -3, ico: "📜", card: { title: "Terugblik", text: "Kijk terug op alles wat je leerde over Jean, het hof en de fabel.", words: [["la morale", "de moraal"]] } },
      { yaw: -100, pitch: 3, ico: "❓", type: "task", quiz: { q: "Welke titel verdien je aan het eind?", options: ["Meester van de Moraal", "Koning van Frankrijk", "Ridder"], answer: 0, explain: "Juist! Meester van de Moraal." } }
    ]
  }
};
