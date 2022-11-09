with open("lat-livy.txt") as fo:
    livy_full = fo.read()

print("Text snippet: ", livy_full[:200])
print("Character count: ", len(livy_full))
print("Approximate token count: ", len(livy_full.split()))

livy = livy_full[:len(livy_full) // 12]
print("Approximate token count:", len(livy.split()))

from cltk import NLP
cltk_nlp = NLP(language="lat")
cltk_nlp.pipeline.processes.pop(-1)
print(cltk_nlp.pipeline.processes)
cltk_doc = cltk_nlp.analyze(text=livy)

# Doc

print(type(cltk_doc))
print([x for x in dir(cltk_doc) if not x.startswith("__")])
print(cltk_doc.tokens[:20])
print(cltk_doc.lemmata[:20])
print(cltk_doc.pos[:20])
print(cltk_doc.sentences_tokens[:2])

# Word

print(len(cltk_doc.words))

print("Original:", cltk_doc.sentences_strings[5])
print("")
print("Translation:",
"""Landing there, the Trojans, as men who, after their all but immeasurable wanderings,
had nothing left but their swords and ships, were driving booty from the fields,
when King Latinus and the Aborigines, who then occupied that country,
rushed down from their city and their fields to repel with arms the violence of the invaders.""")
sentence_6 = cltk_doc.sentences[5]
a_word_concurrent = sentence_6[40]
print(a_word_concurrent)