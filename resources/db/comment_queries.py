import sqlite3
from sqlite3 import Error

from db import create_connection

def select_query(connection, sql, data):
    try:
        cursor = connection.cursor()
        return cursor.execute(sql, data)
    except Error as e:
        print(e)

def get_comments(connection):
    comments = []
    lemma_id = (10,)

    sql_query_comments_lemmas = "SELECT comment_id FROM comments_lemmas WHERE lemma_id=(?)"
    sql_query_comments = "SELECT * FROM comments WHERE comment_id=(?)"

    comment_ids = select_query(connection, sql_query_comments_lemmas, lemma_id).fetchall()
    for id in comment_ids:
        comments.append(select_query(connection, sql_query_comments, id).fetchall())

    return comments

def main():
    database = "./pythonsqlite.db"
    connection = create_connection(database)

    if connection is not None:
        comments = get_comments(connection)
        for comment in comments:
            print(comment)

    else:
        print("Error: cannot create the database connection")

    # connection.commit()
    connection.close()

if __name__ == "__main__":
    main()