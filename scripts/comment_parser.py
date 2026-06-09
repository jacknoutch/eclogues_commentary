import re

comments = [
    """Referring back to the [deus](1.6.3){lt} (l. 6) to whom Tityrus attributes his new-found leisure.""",
    """The death of the twin kids ([gemellos]{lt}) is the evil Meliboeus is referring to.""",
    '''lit. "struck from the sky", i.e. "by lightning"''',
    '''[Musam meditaris](1.2.3--1.2.4){lt} can mean either "you are considering the Muse", or "you are practising a song"'''
]

converted_comments = [
    """<p><a href="javascript:void(0)" onclick="refer('1.2.3--1.2.4')" class="lt">Musam meditaris</a> can mean either "you are considering the Muse", or "you are practising a song"</p>'""",
]

re_refer = r"\[(.*?)\]\((.*?)\)"
re_class_no_refer = r"\[(.*?)\]{(.*?)}"
re_class_with_refer = r"<span(.*?)/span>{(.*?)}"

replacement_string_refer = "<span onclick=\"refer('%s')\">%s</span>"

for comment in comments:
    converted_comment = re.sub(re_refer, replacement_string_refer % ("\g<2>", "\g<1>"),comment)
    converted_comment = re.sub(re_class_no_refer, "<span class='\g<2>'>\g<1></span>", converted_comment)
    converted_comment = re.sub(re_class_with_refer, "<span class=\"link \g<2>\"\g<1>/span>", converted_comment)
    print(converted_comment)