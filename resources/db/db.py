import sqlite3
from sqlite3 import Error
import re
import xml.etree.ElementTree as ET

xml_perseus = "../eclogues_perseus.xml"
perseus_tree = ET.parse(xml_perseus)
perseus_root = perseus_tree.getroot()

xml_lascivaroma = "../eclogue1LR.xml"
lascivaroma_tree = ET.parse(xml_lascivaroma)
lascivaroma_root = lascivaroma_tree.getroot()

xml_comments = "../commentarynotes.xml"
comments_tree = ET.parse(xml_comments)
comments_root = comments_tree.getroot()

class Verse:
    def __init__(self, poemNum, lineNum, text):
        self.poemNum = poemNum
        self.lineNum = lineNum
        self.text = text
        self.lemmas = []
        self.get_lemmas()

    def __str__(self):
        return f"Verse obj: #{self.lineNum} - {self.lemmas}"
    
    def get_lemmas(self):
        regex = "[mts]e(?=cum)|[nv]obis(?=cum)|\w+"
        lemmas = re.findall(regex, self.text)
        for i, lemma in enumerate(lemmas):
            self.lemmas.append(Word(lemma, self.poemNum, self.lineNum, i))

class Word:
    def __init__(self, lemma, poemNum, lineNum, wordIndex):
        self.lemma = lemma
        self.poemNum = poemNum
        self.lineNum = lineNum
        self.wordIndex = wordIndex
        self.lexeme = ""
        self.pos = ""
        self.msd = ""
        self.get_lexeme_pos_msd()

    def __str__(self):
        return f"Word obj: {self.lemma}"

    def get_lexeme_pos_msd(self):
        lemmas = lascivaroma_root.findall(f".//{{http://www.tei-c.org/ns/1.0}}w[@n='{self.poemNum}.{self.lineNum}']")
        lemma_element = lemmas[self.wordIndex]
        self.lexeme = lemma_element.attrib["lemma"]
        self.pos = lemma_element.attrib["pos"]
        self.msd = lemma_element.attrib["msd"]

# verse and lemma data
verse_elements = perseus_root.findall(".//l")
verse_data = []
lemma_data = []
verses = []
word_id = 0

for i, verse in enumerate(verse_elements):
    verse_data.append((i, verse.text))
    verses.append(Verse(1, i+1, verse.text))
    for word in verses[i].lemmas:
        word_id += 1
        lemma_data.append(( id, verses[i].lineNum-1, word.lemma, word.lexeme, word.pos, word.msd))

# comment data
entry_elements = comments_root.findall(".//entry")
comment_data = []
comments_lemmas_data = []
comments_lemmas_id = 0

def get_word_id(poem, line, word):
    word_id = 1
    for verse in verses:
        for lemma in verse.lemmas:
            if lemma.poemNum == int(poem) and lemma.lineNum == int(line) and lemma.wordIndex == int(word)-1:
                return word_id
            word_id += 1

for i, entry in enumerate(entry_elements):
    comment = entry.find("./comment")
    comment_data.append((i, comment.text))

    references = entry.find(".//references")
    references = references.text.split(", ")

    for reference in references:
        [poem, line, word] = reference.split(".")
        word_id = get_word_id(poem, line, word)
        comments_lemmas_data.append((comments_lemmas_id, word_id, i))
        comments_lemmas_id += 1


def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
        :param db_file: database file
        :return: Connection object or None
    """
    connection = None

    try:
        connection = sqlite3.connect(db_file)
        return connection
    except Error as e:
        print(e)
        
    return connection

def create_table(connection, create_table_sql):
    """ create a table from the create_table_sql statement
        :param conn: Connection object
        :param create_table_sql: a CREATE TABLE statement
        :return:
    """
    try:
        cursor = connection.cursor()
        cursor.execute(create_table_sql)
    except Error as e:
        print(e)

def add_bulk_data(connection, sql, data):
    """ add data to the verses table
        :param conn: Connection object
        :param create_table_sql: a INSERT INTO a table statement
        :return:
    """
    try:
        cursor = connection.cursor()
        cursor.executemany(sql, data)
    except Error as e:
        print(e)

def main():
    database = "./pythonsqlite.db"

    sql_create_verses_table = """--sql
        CREATE TABLE IF NOT EXISTS verses (
            verse_id INTEGER PRIMARY KEY,
            verse_text TEXT
        )"""

    sql_create_lemmas_table = """--sql
            CREATE TABLE IF NOT EXISTS lemmas (
            lemma_id integer PRIMARY KEY,
            line_id INTEGER NOT NULL,
            lemma text,
            lexeme text,
            pos text,
            msd text,
            FOREIGN KEY (line_id) REFERENCES verses (id)
            )"""
    
    sql_create_comments_table = """--sql
        CREATE TABLE IF NOT EXISTS comments (
            comment_id INTEGER PRIMARY KEY,
            comment TEXT
        )"""
    
    sql_create_comments_lemmas_table = """--sql
        CREATE TABLE IF NOT EXISTS comments_lemmas (
            comment_lemma_id INTEGER PRIMARY KEY,
            comment_id INTEGER,
            lemma_id INTEGER,
            FOREIGN KEY (comment_id) REFERENCES (comment_id),
            FOREIGN KEY (lemma_id) REFERENCES (lemma_id),
        )"""

    sql_add_verses = "INSERT INTO verses VALUES (?,?)"

    sql_add_lemmas = "INSERT INTO lemmas VALUES (?,?,?,?,?,?)"

    sql_add_comments = "INSERT INTO comments VALUES (?,?)"

    sql_add_comments_lemmas = "INSERT INTO comments_lemmas VALUES (?,?,?)"
    
    connection = create_connection(database)

    if connection is not None:
        # # create verses table
        # create_table(connection, sql_create_verses_table)

        # # create lemmas table
        # create_table(connection, sql_create_lemmas_table)

        # # create comments table
        # create_table(connection, sql_create_comments_table)

        # # create comments_lemmas table
        # create_table(connection, sql_create_comments_lemmas_table)
        
        # # add data to verses table
        # add_bulk_data(connection, sql_add_verses, verse_data)

        # # add data to the lemmas table
        # add_bulk_data(connection, sql_add_lemmas, lemma_data)

        # # add data to the comments table
        # add_bulk_data(connection, sql_add_comments_lemmas, comments_lemmas_data)

        pass

    else:
        print("Error: cannot create the database connection")

    connection.commit()
    connection.close()

if __name__ == "__main__":
    main()