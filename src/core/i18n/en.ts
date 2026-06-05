import dedent from 'dedent';
import { Format, Level } from 'src/generated/prisma/enums';

export default {
    registration: dedent(`
        <b>Registration</b>
        Before starting the lesson, let's get to know each other a little better.
        Please fill in the following information:
        First name, last name:
        Date of birth (day, month, year):
        Nationality:
        Place of work:
        Permanent address:
        Contact number:
    `),
    test: dedent(`
        <b>Language Level Assessment</b>
        Let’s take a short diagnostic test.
        This test will help determine your current level of Kazakh language proficiency.
        Don’t worry — there are no “right” or “wrong” results here. We simply want to identify the most suitable level for you to begin learning.
    `),
    testResult: dedent(`
        <b>Result</b>
        The test is completed! 🎉
        Your level: {{level}} ({{levelName}})
        Great start!
        Now we will work on tasks that match your level.
        Let’s learn Kazakh together, practice, make mistakes, learn again — most importantly, keep moving forward! 😊
    `),
    levelNames: {
        [Level.A1]: "Beginner",
        [Level.A2]: "Elementary",
        [Level.B1]: "Intermediate",
        [Level.B2]: "Upper-Intermediate",
        [Level.C1]: "Advanced",
    },
    chooseFormat: dedent(`
        <b>Learning Format Selection</b>
        Which learning format do you prefer?
    `),
    formats: {
        [Format.Online]: "✅ Online",
        [Format.Offline]: "✅ Offline"
    },
    offlineFormat: dedent(`
        <b>Offline Learning</b>
        If you choose the offline format, we will be happy to welcome you to our center!
        <b>Institution:</b>
        State Institution "Department of Language Development of Aktobe Region"
        Communal State Institution "Language Training Center"
        <b>Address:</b>
        86 Turgenev Street, Aktobe City
        <b>Contact Number:</b>
        +7 (7132) 46-78-68
        
        Information Board
        Stay in touch with us:
        📱 Instagram page: <a href="https://www.instagram.com/tilderdi.oqytu.ortalygy/">Тілдерді оқыту орталығы</a>
        📘 Facebook page: <a href="https://www.facebook.com/tilderdi.oqytu.ortalygy/about">Тілдерді оқыту орталығы</a>
        🎥 YouTube channel: <a href="https://www.youtube.com/@tilaqtobe">Тілдерді оқыту орталығы</a>
        🌐 Language toolbox: 
        <a href="https://tilqazyna.kz">Тіл-Қазына</a>
        <a href="https://tilqural.kz">Тілқұрал</a>
        <a href="https://soyle.kz">Сөйле</a>
        <a href="https://www.instagram.com/qazaqgrammar?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw">Qazaqgrammar</a>
        <a href="https://emle.kz">Қазақ тілінің орфографиялық электрондық базасы</a>
        <a href="https://termincom.kz/about">Терминдер</a>
        <a href="https://sozdikqor.kz">Сөздікқор</a>
        <a href="https://abai.institute/?school=05125">Қазақ тілін онлайн үйрену</a>
    `),
    onlineFormat: dedent(`
        <b>We offer you the following learning topics:</b>
    `),
    lockedTopic: 'This lesson is not available. Complete previous topics or move to the next one.',
    topic: dedent(`<b>In this lesson, we learn the language through 4 skills:</b>`),
    reading: dedent(`
        <b>Reading</b>
        Read the short text.
        After reading, try to complete the tasks.
        Take your time — understanding what you read is what matters.
    `),
    writing: dedent(`
        <b>Writing</b>
        Now, try to express your thoughts in writing.
        Complete a short writing task on the topic.
        Don't be afraid of making mistakes — we learn through practice!    
    `),
    listening: dedent(`
        <b>Listening</b>
        Now, let's listen to the audio. 🎧
        Listen to the text carefully and try to catch the main idea.
        Then, try to complete the tasks.
        Don't worry — with every listening practice, your language skills get better! 🌟
    `),
    speaking: dedent(`
        <b>Speaking</b>
        Try to answer the questions orally.
        Try to speak freely.
        The main thing is to strive to express your thoughts in Kazakh.
        You can definitely do it! 🌟
    `),
    finishTopic: dedent(`
        <b>Summary</b>
        Well done! 🎉
        You have successfully completed all the tasks on this topic!
        Give yourself a round of applause 👏
        Now you are ready to move on to the next topic!
    `),
    menu: {
        title: "Menu",
        topics: "📚 Topics",
        back: "⬅️ Back",
        reading: "Reading",
        writing: "Writing",
        listening: "Listening",
        speaking: "Speaking"
    },
    lockedTask: 'This task is not available. Complete previous tasks or move to the next one.',
    finishedTask: dedent(`
        <b>Well done! 🎉</b>
        You have successfully completed all the tasks on this task!
        Give yourself a round of applause 👏
        Now you are ready to move on to the next task!
    `)
} as const;
