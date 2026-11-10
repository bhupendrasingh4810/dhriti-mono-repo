export type SeedPerson = {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
};

const records = [
  ["Essy", "Burleigh", "eburleigh0@hibu.com", "Female"], ["Tabitha", "Arpin", "tarpin1@tmail.com", "Female"],
  ["Jolene", "Jesty", "jjesty2@blinklist.com", "Female"], ["Bobbe", "Delatour", "bdelatour3@carecollective.com", "Female"],
  ["Cathe", "Cadle", "ccadle4@yolasite.com", "Female"], ["Guthry", "Klauser", "gklauser5@squarespace.com", "Male"],
  ["Reena", "Rocca", "rrocca6@businesswire.com", "Agender"], ["Miquela", "Duddel", "mduddel7@ibm.com", "Female"],
  ["Jacinthe", "Ekford", "jekford8@goo.ne.jp", "Female"], ["Noach", "Gregh", "ngregh9@cam.ac.uk", "Male"],
  ["Daren", "Boorne", "dboornea@etsy.com", "Male"], ["Patricio", "Jeness", "pjenessb@dailymail.co.uk", "Male"],
  ["Wolf", "Micah", "wmicahc@joomla.org", "Male"], ["Marlo", "Bonaire", "mbonaired@homestead.com", "Female"],
  ["Phil", "Kooman", "pkoomane@exchanger.com", "Female"], ["Cherilyn", "Croasdale", "ccroasdalef@fotki.com", "Female"],
  ["Elva", "McGirr", "emcgirrg@blinklist.com", "Female"], ["Rory", "Orbell", "rorbellh@friendfeed.com", "Male"],
  ["Carmen", "Gorsby", "cgorsbyi@imageshack.us", "Female"], ["Bendix", "Zellner", "bzellnerj@yellowbook.com", "Male"],
  ["Skipton", "Kelshaw", "skelshawk@list-manage.com", "Male"], ["Fabien", "Roskelly", "froskellyl@thetimes.co.uk", "Male"],
  ["Agna", "McFetrich", "amcfetrichm@spotify.com", "Female"], ["Sheilah", "Cluelow", "scluelown@networksolutions.com", "Female"],
  ["Nanny", "Eplett", "nepletto@mapy.cz", "Female"], ["Wilbur", "Auckland", "waucklandp@piano.io", "Male"],
  ["Eldon", "Maffezzoli", "emaffezzo1q@google.it", "Male"], ["Rogelio", "Ahlin", "rahlinr@pbs.org", "Male"],
  ["Melinda", "Thake", "mthakes@eurora.eu", "Female"], ["Laurie", "Myring", "lmyringt@alb.com", "Female"],
  ["Nico", "Northam", "nnorthamu@mlb.com", "Male"], ["Christian", "Ruppert", "cruppertv@linkedin.com", "Agender"],
  ["Leesa", "Jime", "ljimew@hostgator.com", "Female"], ["Norris", "Swaines", "nswainesx@cnbc.ca", "Male"],
  ["Mair", "Blei", "mbleiy@nhs.uk", "Female"], ["Ric", "Anthonson", "ranthonsenz@dts.ch", "Male"],
  ["Umberto", "Thomason", "uthomason10@cmu.edu", "Male"], ["Merissa", "Silversmid", "msilversmid11@freewebs.com", "Female"],
  ["Dianna", "McAloren", "dmcaloren12@ibm.com", "Female"], ["Joyann", "Martersen", "jmartersen13@apple.com", "Female"],
  ["Petr", "Cosford", "pcosford14@wikimedia.org", "Male"], ["Nicoline", "McKinlay", "nmckinlay15@opensource.org", "Female"],
  ["Moyra", "Barritt", "mbarritt16@webmd.com", "Female"], ["Natalie", "Siemons", "nsiemons17@goodreads.com", "Female"],
  ["Ketty", "Larmont", "klarmont18@oua.com.br", "Female"], ["Lorri", "McCurtin", "lmccurtin19@macromedia.com", "Female"],
  ["Trey", "Kopis", "tkopis1a@xinhuanet.com", "Male"], ["Rodrigo", "Germon", "rgermon1b@wordpress.com", "Genderfluid"],
  ["Janina", "Bulley", "jbulley1c@163.com", "Female"], ["Roderich", "Yelden", "ryelden1d@digg.com", "Male"],
  ["Merilyn", "Wreak", "mwreak1e@msn.com", "Female"], ["Deane", "Brum", "dbrum1f@example.com", "Male"],
  ["Katharine", "Parrington", "kparrington1g@mediafire.com", "Female"], ["Issi", "Rizzo", "irizzo1h@cisco.com", "Female"],
  ["Katuscha", "Quincey", "kquincey1i@technorati.com", "Female"], ["Aignes", "Losebie", "alosebie1j@oracle.com", "Female"],
  ["Mallorie", "Selway", "mselway1k@netvibes.com", "Female"], ["Shelley", "Dunstan", "sdunstan1l@craigslist.org", "Male"],
  ["Corey", "Dancer", "cdancer1m@mail.ru", "Male"], ["Dev", "Rosenstock", "drosenstock1n@usgs.gov", "Male"],
  ["Evie", "Morey", "emorey1o@nationalgeographic.com", "Female"], ["Colin", "Antyshev", "cantyshev1p@gov.uk", "Male"],
  ["Sayres", "Grogor", "sgrogor1q@amazonaws.com", "Male"], ["Briny", "Wrathall", "bwrathall1r@flickr.com", "Genderqueer"],
  ["Ramona", "Mokes", "rmokes1s@ca.gov", "Female"], ["Lalo", "Farres", "lfarres1t@usdatoday.com", "Male"],
  ["Lief", "Buddell", "lbuddell1u@redcross.org", "Male"], ["Trevor", "Eastop", "teastop1v@shop-pro.jp", "Genderqueer"],
  ["Reeda", "Sindall", "rsindall1w@latimes.com", "Agender"], ["Ortensia", "Greson", "ogreson1x@digg.com", "Female"],
] as const;

export const seedPeople: SeedPerson[] = records.map(([firstName, lastName, email, gender]) => ({
  firstName,
  lastName,
  email,
  gender,
}));
