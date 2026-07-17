// Datos del "Update Set" oficial de Panini (World Cup 2026): 118 cromos que
// actualizan jugadores del álbum original. Cada entrada se ancla a un cromo
// existente — `code` coincide con el `Sticker.code` de album.ts (ej. "MEX 2").
//
// Generado a partir del CSV oficial (limpiando la codificación Windows-1252).
// Si Panini publica correcciones, editar esta lista a mano.

export type UpdateEntry = {
  /** Código del cromo que actualiza, idéntico a Sticker.code (ej. "MEX 2"). */
  code: string;
  group: string;
  teamCode: string;
  position: string;
  /** Jugador impreso originalmente en ese cromo. */
  originalName: string;
  /** Jugador definitivo que trae el update set. */
  replacementName: string;
};

export const UPDATE_ENTRIES: UpdateEntry[] = [
  { code: "MEX 2", group: "A", teamCode: "MEX", position: "GK", originalName: "Luis Malagón", replacementName: "Guillermo Ochoa" },
  { code: "MEX 8", group: "A", teamCode: "MEX", position: "MF", originalName: "Diego Lainez", replacementName: "Gilberto Mora" },
  { code: "MEX 9", group: "A", teamCode: "MEX", position: "MF", originalName: "Carlos Rodríguez", replacementName: "Álvaro Fidalgo" },
  { code: "MEX 12", group: "A", teamCode: "MEX", position: "MF", originalName: "Marcel Ruiz", replacementName: "Érik Lira" },
  { code: "MEX 14", group: "A", teamCode: "MEX", position: "MF", originalName: "Érick Sánchez", replacementName: "Brian Gutiérrez" },
  { code: "MEX 15", group: "A", teamCode: "MEX", position: "FW", originalName: "Hirving Lozano", replacementName: "Armando González" },
  { code: "RSA 8", group: "A", teamCode: "RSA", position: "DF", originalName: "Siyabonga Ngezana", replacementName: "Ime Okon" },
  { code: "RSA 14", group: "A", teamCode: "RSA", position: "MF", originalName: "Bathusi Aubaas", replacementName: "Themba Zwane" },
  { code: "RSA 16", group: "A", teamCode: "RSA", position: "MF", originalName: "Sipho Mbule", replacementName: "Jayden Adams" },
  { code: "RSA 19", group: "A", teamCode: "RSA", position: "FW", originalName: "Mohau Nkota", replacementName: "Relebohile Mofokeng" },
  { code: "KOR 5", group: "A", teamCode: "KOR", position: "DF", originalName: "Yumin Cho", replacementName: "Moonhwan Kim" },
  { code: "KOR 9", group: "A", teamCode: "KOR", position: "DF", originalName: "Myungjae Lee", replacementName: "Taehyeon Kim" },
  { code: "CZE 15", group: "A", teamCode: "CZE", position: "MF", originalName: "Matěj Vydra", replacementName: "David Douděra" },
  { code: "CZE 16", group: "A", teamCode: "CZE", position: "MF", originalName: "Vasil Kušej", replacementName: "Vladimír Darida" },
  { code: "CZE 18", group: "A", teamCode: "CZE", position: "FW", originalName: "Václav Černý", replacementName: "Mojmír Chytil" },
  { code: "CAN 5", group: "B", teamCode: "CAN", position: "DF", originalName: "Samuel Adekugbe", replacementName: "Joel Waterman" },
  { code: "CAN 9", group: "B", teamCode: "CAN", position: "DF", originalName: "Kamal Miller", replacementName: "Alfie Jones" },
  { code: "QAT 8", group: "B", teamCode: "QAT", position: "DF", originalName: "Tarek Salman", replacementName: "Ayoub Aloui" },
  { code: "QAT 14", group: "B", teamCode: "QAT", position: "MF", originalName: "Mohammed Waad", replacementName: "Jassem Gaber" },
  { code: "QAT 19", group: "B", teamCode: "QAT", position: "FW", originalName: "Ahmed Al-Ganehi", replacementName: "Mohammed Muntari" },
  { code: "BRA 3", group: "C", teamCode: "BRA", position: "GK", originalName: "Bento", replacementName: "Weverton" },
  { code: "BRA 5", group: "C", teamCode: "BRA", position: "DF", originalName: "Éder Militão", replacementName: "Alex Sandro" },
  { code: "BRA 15", group: "C", teamCode: "BRA", position: "FW", originalName: "Rodrygo", replacementName: "Neymar Jr" },
  { code: "BRA 16", group: "C", teamCode: "BRA", position: "FW", originalName: "João Pedro", replacementName: "Endrick" },
  { code: "BRA 20", group: "C", teamCode: "BRA", position: "FW", originalName: "Estêvão", replacementName: "Igor Thiago" },
  { code: "MAR 7", group: "C", teamCode: "MAR", position: "DF", originalName: "Romain Saïss", replacementName: "Issa Diop" },
  { code: "MAR 8", group: "C", teamCode: "MAR", position: "DF", originalName: "Jawad El Yamiq", replacementName: "Anass Salah-Eddine" },
  { code: "MAR 9", group: "C", teamCode: "MAR", position: "DF", originalName: "Adam Masina", replacementName: "Chadi Riad" },
  { code: "MAR 12", group: "C", teamCode: "MAR", position: "MF", originalName: "Eliesse Ben Seghir", replacementName: "Neil El Aynaoui" },
  { code: "MAR 16", group: "C", teamCode: "MAR", position: "FW", originalName: "Youssef En-Nesyri", replacementName: "Chemsdine Talbi" },
  { code: "HAI 8", group: "C", teamCode: "HAI", position: "DF", originalName: "Garven Metusala", replacementName: "Wilguens Paugain" },
  { code: "HAI 14", group: "C", teamCode: "HAI", position: "FW", originalName: "Christopher Attys", replacementName: "Wilson Isidor" },
  { code: "SCO 12", group: "C", teamCode: "SCO", position: "DF", originalName: "Billy Gilmour", replacementName: "Nathan Patterson" },
  { code: "USA 9", group: "D", teamCode: "USA", position: "MF", originalName: "Tanner Tessmann", replacementName: "Gio Reyna" },
  { code: "USA 14", group: "D", teamCode: "USA", position: "MF", originalName: "Diego Luna", replacementName: "Sebastian Berhalter" },
  { code: "PAR 9", group: "D", teamCode: "PAR", position: "MF", originalName: "Mathías Villasanti", replacementName: "Braian Ojeda" },
  { code: "PAR 19", group: "D", teamCode: "PAR", position: "FW", originalName: "Ángel Romero", replacementName: "Álex Arce" },
  { code: "AUS 3", group: "D", teamCode: "AUS", position: "GK", originalName: "Joe Gauci", replacementName: "Paul Izzo" },
  { code: "AUS 9", group: "D", teamCode: "AUS", position: "DF", originalName: "Lewis Miller", replacementName: "Jason Geria" },
  { code: "AUS 12", group: "D", teamCode: "AUS", position: "MF", originalName: "Riley McGree", replacementName: "Ajdin Hrustic" },
  { code: "AUS 16", group: "D", teamCode: "AUS", position: "MF", originalName: "Patrick Yazbek", replacementName: "Paul Okon-Engstler" },
  { code: "AUS 17", group: "D", teamCode: "AUS", position: "FW", originalName: "Craig Goodwin", replacementName: "Nishan Velupillay" },
  { code: "GER 2", group: "E", teamCode: "GER", position: "GK", originalName: "Marc-André Ter Stegen", replacementName: "Manuel Neuer" },
  { code: "GER 8", group: "E", teamCode: "GER", position: "DF", originalName: "Ridle Baku", replacementName: "Malick Thiaw" },
  { code: "GER 9", group: "E", teamCode: "GER", position: "MF", originalName: "Maximilian Mittelstädt", replacementName: "Angelo Stiller" },
  { code: "GER 16", group: "E", teamCode: "GER", position: "MF", originalName: "Serge Gnabry", replacementName: "Aleksandar Pavlović" },
  { code: "GER 19", group: "E", teamCode: "GER", position: "FW", originalName: "Karim Adeyemi", replacementName: "Deniz Undav" },
  { code: "CIV 7", group: "E", teamCode: "CIV", position: "DF", originalName: "Willy Boly", replacementName: "Guéla Doué" },
  { code: "CIV 14", group: "E", teamCode: "CIV", position: "FW", originalName: "Jean-Philippe Gbamin", replacementName: "Nicolas Pépé" },
  { code: "CIV 16", group: "E", teamCode: "CIV", position: "FW", originalName: "Sébastien Haller", replacementName: "Elye Wahi" },
  { code: "ECU 15", group: "E", teamCode: "ECU", position: "FW", originalName: "Leonardo Campana", replacementName: "Anthony Valencia" },
  { code: "NED 8", group: "F", teamCode: "NED", position: "MF", originalName: "Jeremie Frimpong", replacementName: "Quinten Timber" },
  { code: "NED 15", group: "F", teamCode: "NED", position: "FW", originalName: "Xavi Simons", replacementName: "Noa Lang" },
  { code: "JPN 3", group: "F", teamCode: "JPN", position: "DF", originalName: "Henry Heroki Mochizuki", replacementName: "Hiroki Ito" },
  { code: "JPN 9", group: "F", teamCode: "JPN", position: "MF", originalName: "Yuki Soma", replacementName: "Wataru Endo" },
  { code: "JPN 16", group: "F", teamCode: "JPN", position: "FW", originalName: "Takumi Minamino", replacementName: "Daizen Maeda" },
  { code: "JPN 17", group: "F", teamCode: "JPN", position: "FW", originalName: "Shuto Machino", replacementName: "Yuito Suzuki" },
  { code: "SWE 5", group: "F", teamCode: "SWE", position: "DF", originalName: "Emil Holm", replacementName: "Carl Starfelt" },
  { code: "SWE 9", group: "F", teamCode: "SWE", position: "MF", originalName: "Hugo Larsson", replacementName: "Besfort Zeneli" },
  { code: "SWE 16", group: "F", teamCode: "SWE", position: "FW", originalName: "Roony Bardghji", replacementName: "Benjamin Nygren" },
  { code: "SWE 17", group: "F", teamCode: "SWE", position: "FW", originalName: "Dejan Kulusevski", replacementName: "Alexander Bernhardsson" },
  { code: "TUN 2", group: "F", teamCode: "TUN", position: "GK", originalName: "Bechir Ben Saïd", replacementName: "Abdelmouhib Chamakh" },
  { code: "TUN 6", group: "F", teamCode: "TUN", position: "DF", originalName: "Yassine Meriah", replacementName: "Omar Rekik" },
  { code: "TUN 10", group: "F", teamCode: "TUN", position: "MF", originalName: "Aïssa Laïdouni", replacementName: "Rani Khedira" },
  { code: "TUN 11", group: "F", teamCode: "TUN", position: "MF", originalName: "Ferjani Sassi", replacementName: "Anis Ben Slimane" },
  { code: "TUN 12", group: "F", teamCode: "TUN", position: "MF", originalName: "Mohamed Ali Ben Romdhane", replacementName: "Mohamed Belhadj Mahmoud" },
  { code: "TUN 19", group: "F", teamCode: "TUN", position: "FW", originalName: "Sayfallah Ltaief", replacementName: "Sebastian Tounekti" },
  { code: "TUN 20", group: "F", teamCode: "TUN", position: "FW", originalName: "Naïm Sliti", replacementName: "Mortadha Ben Ouanes" },
  { code: "BEL 19", group: "G", teamCode: "BEL", position: "FW", originalName: "Loïs Openda", replacementName: "Dodi Lukébakio" },
  { code: "EGY 4", group: "G", teamCode: "EGY", position: "DF", originalName: "Mohamed Hamdy", replacementName: "Mohamed Abdelmonem" },
  { code: "EGY 6", group: "G", teamCode: "EGY", position: "MF", originalName: "Khaled Sobhi", replacementName: "Mahmoud Saber" },
  { code: "EGY 16", group: "G", teamCode: "EGY", position: "FW", originalName: "Osama Faisal", replacementName: "Ibrahim Adel" },
  { code: "EGY 18", group: "G", teamCode: "EGY", position: "FW", originalName: "Mostafa Mohamed", replacementName: "Haissem Hassan" },
  { code: "IRN 3", group: "G", teamCode: "IRN", position: "DF", originalName: "Morteza Pouraliganji", replacementName: "Arya Yousefi" },
  { code: "IRN 9", group: "G", teamCode: "IRN", position: "DF", originalName: "Sadegh Moharrami", replacementName: "Ali Nemati" },
  { code: "IRN 14", group: "G", teamCode: "IRN", position: "MF", originalName: "Omid Noorafkan", replacementName: "Amirmohammad Razzaghinia" },
  { code: "IRN 17", group: "G", teamCode: "IRN", position: "FW", originalName: "Sardar Azmoun", replacementName: "Ali Alipour" },
  { code: "IRN 20", group: "G", teamCode: "IRN", position: "FW", originalName: "Ali Gholizadeh", replacementName: "Amirhossein Hosseinzadeh" },
  { code: "ESP 3", group: "H", teamCode: "ESP", position: "DF", originalName: "Robin Le Normand", replacementName: "Pau Cubarsí" },
  { code: "ESP 5", group: "H", teamCode: "ESP", position: "DF", originalName: "Dean Huijsen", replacementName: "Alejandro Grimaldo" },
  { code: "ESP 7", group: "H", teamCode: "ESP", position: "DF", originalName: "Dani Carvajal", replacementName: "Marcos Llorente" },
  { code: "ESP 19", group: "H", teamCode: "ESP", position: "FW", originalName: "Álvaro Morata", replacementName: "Yeremy Pino" },
  { code: "CPV 11", group: "H", teamCode: "CPV", position: "MF", originalName: "Patrick Andrade", replacementName: "Laros Duarte" },
  { code: "CPV 20", group: "H", teamCode: "CPV", position: "FW", originalName: "Bebé", replacementName: "Nuno Da Costa" },
  { code: "KSA 3", group: "H", teamCode: "KSA", position: "DF", originalName: "Abdulrahman Alsanbi", replacementName: "Abdulelah Alamri" },
  { code: "KSA 14", group: "H", teamCode: "KSA", position: "MF", originalName: "Saleh Abu Alshamat", replacementName: "Mohamed Kanno" },
  { code: "KSA 15", group: "H", teamCode: "KSA", position: "DF", originalName: "Marwan Alsahafi", replacementName: "Ali Majrashi" },
  { code: "KSA 17", group: "H", teamCode: "KSA", position: "FW", originalName: "Abdulrahman Alobud", replacementName: "Sultan Mandash" },
  { code: "URU 9", group: "H", teamCode: "URU", position: "DF", originalName: "Nahitan Nández", replacementName: "Matías Viña" },
  { code: "FRA 10", group: "I", teamCode: "FRA", position: "MF", originalName: "Eduardo Camavinga", replacementName: "N'Golo Kanté" },
  { code: "FRA 18", group: "I", teamCode: "FRA", position: "FW", originalName: "Kingsley Coman", replacementName: "Rayan Cherki" },
  { code: "FRA 19", group: "I", teamCode: "FRA", position: "FW", originalName: "Hugo Ekitiké", replacementName: "Marcus Thuram" },
  { code: "SEN 17", group: "I", teamCode: "SEN", position: "FW", originalName: "Boulaye Dia", replacementName: "Ibrahim Mbaye" },
  { code: "IRQ 17", group: "I", teamCode: "IRQ", position: "MF", originalName: "Osama Rashid", replacementName: "Kevin Yakob" },
  { code: "NOR 17", group: "I", teamCode: "NOR", position: "FW", originalName: "Aron Dønnum", replacementName: "Jens Petter Hauge" },
  { code: "ARG 15", group: "J", teamCode: "ARG", position: "MF", originalName: "Franco Mastantuono", replacementName: "Giovani Lo Celso" },
  { code: "ALG 2", group: "J", teamCode: "ALG", position: "GK", originalName: "Alexis Guendouz", replacementName: "Luca Zidane" },
  { code: "ALG 4", group: "J", teamCode: "ALG", position: "DF", originalName: "Youcef Atal", replacementName: "Rafik Belghali" },
  { code: "ALG 8", group: "J", teamCode: "ALG", position: "MF", originalName: "Ismaël Bennacer", replacementName: "Ibrahim Maza" },
  { code: "ALG 16", group: "J", teamCode: "ALG", position: "FW", originalName: "Saïd Benrahma", replacementName: "Adil Boulbina" },
  { code: "ALG 19", group: "J", teamCode: "ALG", position: "FW", originalName: "Baghdad Bounedjah", replacementName: "Farès Ghedjemis" },
  { code: "JOR 16", group: "J", teamCode: "JOR", position: "FW", originalName: "Yazan Al-Naimat", replacementName: "Odeh Fakhoury" },
  { code: "UZB 6", group: "K", teamCode: "UZB", position: "DF", originalName: "Husniddin Aliqulov", replacementName: "Jakhongir Urozov" },
  { code: "UZB 14", group: "K", teamCode: "UZB", position: "MF", originalName: "Azizbek Turgunboev", replacementName: "Azizjon Ganiev" },
  { code: "UZB 15", group: "K", teamCode: "UZB", position: "MF", originalName: "Khojimat Erkinov", replacementName: "Akmal Mozgovoy" },
  { code: "ENG 6", group: "L", teamCode: "ENG", position: "DF", originalName: "Trent Alexander-Arnold", replacementName: "Nico O'Reilly" },
  { code: "ENG 12", group: "L", teamCode: "ENG", position: "MF", originalName: "Cole Palmer", replacementName: "Eberechi Eze" },
  { code: "ENG 16", group: "L", teamCode: "ENG", position: "FW", originalName: "Phil Foden", replacementName: "Noni Madueke" },
  { code: "CRO 12", group: "L", teamCode: "CRO", position: "MF", originalName: "Lovro Majer", replacementName: "Nikola Vlašić" },
  { code: "CRO 20", group: "L", teamCode: "CRO", position: "FW", originalName: "Franjo Ivanović", replacementName: "Igor Matanović" },
  { code: "GHA 3", group: "L", teamCode: "GHA", position: "GK", originalName: "Tariq Lamptey", replacementName: "Benjamin Asare" },
  { code: "GHA 4", group: "L", teamCode: "GHA", position: "DF", originalName: "Mohammed Salisu", replacementName: "Kojo Peprah Oppong" },
  { code: "GHA 6", group: "L", teamCode: "GHA", position: "DF", originalName: "Alexander Djiku", replacementName: "Jonas Adjetey" },
  { code: "GHA 11", group: "L", teamCode: "GHA", position: "MF", originalName: "Salis Abdul Samed", replacementName: "Kwasi Sibo" },
  { code: "GHA 14", group: "L", teamCode: "GHA", position: "FW", originalName: "Mohammed Kudus", replacementName: "Christopher Bonsu Baah" },
  { code: "GHA 17", group: "L", teamCode: "GHA", position: "FW", originalName: "André Ayew", replacementName: "Ernest Nuamah" },
  { code: "GHA 18", group: "L", teamCode: "GHA", position: "FW", originalName: "Joseph Paintsil", replacementName: "Brandon Thomas-Asante" },
  { code: "GHA 19", group: "L", teamCode: "GHA", position: "FW", originalName: "Osman Bukari", replacementName: "Prince Adu" },
];

export const TOTAL_UPDATE = UPDATE_ENTRIES.length;

export const UPDATE_BY_CODE = new Map<string, UpdateEntry>(
  UPDATE_ENTRIES.map((e) => [e.code, e]),
);

export function getUpdateEntry(code: string): UpdateEntry | undefined {
  return UPDATE_BY_CODE.get(code);
}

export function hasUpdate(code: string): boolean {
  return UPDATE_BY_CODE.has(code);
}

/** Códigos de equipo que tienen al menos un cromo en el update set. */
export const UPDATE_TEAM_CODES: string[] = [
  ...new Set(UPDATE_ENTRIES.map((e) => e.teamCode)),
];
