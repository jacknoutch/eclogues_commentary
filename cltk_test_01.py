from cltk import NLP
vitruvius = "Architecti est scientia pluribus disciplinis et variis eruditionibus ornata, quae ab ceteris artibus perficiuntur. Opera ea nascitur et fabrica et ratiocinatione."
cltk_nlp = NLP(language="lat")
cltk_doc = cltk_nlp.analyze(text=vitruvius)

cltk_doc.tokens[-10]
cltk_doc.lemmata[-10]
cltk_doc.morphosyntactic_features[3]
cltk_doc.pos[-10]
cltk_doc.sentences_tokens[-10]
