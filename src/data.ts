/**
 * Data Agent — Act 1 Script Content
 * Sever Water (断水)
 *
 * All text is verbatim from script_act1.md.
 * DO NOT modify creative content.
 */

export interface ChoiceOption {
  id: string;
  label: string;
  intent: string;
  outcome: string;
}

export interface AudioTrigger {
  action: 'play' | 'fade-out' | 'hard-mute' | 'fade-in';
  cue: number;
  duration?: number; // seconds
  volume?: number; // 0-1
}

export interface ImageTrigger {
  src: string;
  transition: 'fade-in' | 'fade-out' | 'crossfade' | 'hold' | 'instant';
  duration?: number; // seconds
}

export interface GameNode {
  id: string;
  text: string;
  type: 'narration' | 'dialogue' | 'blockquote' | 'choice' | 'scene-heading' | 'title' | 'ending';
  speaker?: string;
  sceneLabel?: string;
  locationLabel?: string;
  moodLabel?: string;
  narrationAudio?: string;
  image?: ImageTrigger;
  audio?: AudioTrigger;
  choices?: ChoiceOption[];
  next?: string;
}

// ============================================================================
// NARRATION AUDIO MAP
// ============================================================================
const NAR = {
  s1_opening: '/assets/narration/nar_a1_s1_01_opening.mp3',
  s1_flashback: '/assets/narration/nar_a1_s1_02_flashback.mp3',
  s1_rain: '/assets/narration/nar_a1_s1_03_rain.mp3',
  s2_three: '/assets/narration/nar_a1_s2_01_three.mp3',
  s2_bell: '/assets/narration/nar_a1_s2_02_bell.mp3',
  s2_liu: '/assets/narration/nar_a1_s2_03_liu_intro.mp3',
  s3_inn: '/assets/narration/nar_a1_s3_01_inn.mp3',
  s3_reflection: '/assets/narration/nar_a1_s3_02_reflection.mp3',
  s3_lu: '/assets/narration/nar_a1_s3_03_lu_arrival.mp3',
};

// ============================================================================
// IMAGES
// ============================================================================
const IMG = {
  title: '/assets/images/b1_08_style_anchor_moon.png',
  teacher_gate: '/assets/images/b1_04_teacher_at_gate.png',
  gorge_confrontation: '/assets/images/b2_a1_01_gorge_confrontation.png',
  gorge_rescue: '/assets/images/b2_a1_02_gorge_rescue.png',
  inn_exterior: '/assets/images/b2_a1_03_inn_exterior.png',
  carved_poem: '/assets/images/b2_a1_04_carved_poem.png',
  lu_arrival: '/assets/images/b2_a1_05_lu_yuan_arrival.png',
  ending: '/assets/images/b1_06_sword_hero_shot.png',
};

// ============================================================================
// SCRIPT NODES — Act 1
// ============================================================================


export const gameNodes: Record<string, GameNode> = {
  // ========================================================================
  // TITLE SCREEN
  // ========================================================================
  title: {
    id: 'title',
    text: '断水',
    type: 'title',
    image: { src: IMG.title, transition: 'hold' },
    audio: { action: 'play', cue: 1, duration: 2 },
    next: 'scene1_heading',
  },

  // ========================================================================
  // SCENE 1 · ONE-LINE SKY
  // ========================================================================
  scene1_heading: {
    id: 'scene1_heading',
    text: 'SCENE 1 · ONE-LINE SKY',
    type: 'scene-heading',
    sceneLabel: 'ACT I · THE DEBT',
    locationLabel: 'ONE-LINE SKY',
    moodLabel: 'RAIN',
    next: 's1_opening',
  },

  s1_opening: {
    id: 's1_opening',
    text: 'The gorge is called 一线天, and true to its name, the rain falls in a single sheet through the narrow cleft above. The stream at your feet runs red-brown with silt and something else. Three men in grey. One of them — favouring his right leg — learned first that 断水剑法 is not a name given lightly. The other two have learned caution.',
    type: 'narration',
    narrationAudio: NAR.s1_opening,
    image: { src: IMG.gorge_confrontation, transition: 'crossfade', duration: 2 },
    next: 's1_flashback',
  },

  s1_flashback: {
    id: 's1_flashback',
    text: 'They were not hired for your life. They were hired for the letter in your inner robe. The one your teacher pressed into your palm at the mountain gate three days ago, his hand trembling slightly — you had never seen him tremble before. He had taught you to hold a sword at five. At eighteen, he had made you repeat the First Form ten thousand times in one winter until your fingers bled and you stopped complaining. You know every expression his face can make. This one was new.',
    type: 'narration',
    narrationAudio: NAR.s1_flashback,
    image: { src: IMG.teacher_gate, transition: 'fade-in', duration: 2 },
    next: 's1_teacher_dialogue',
  },

  s1_teacher_dialogue: {
    id: 's1_teacher_dialogue',
    text: '"The world below the mountain is different," he had said. "Deliver this to Falling Goose Peak. If I don\'t send for you in one month —"',
    type: 'dialogue',
    speaker: 'Teacher',
    next: 's1_unfinished',
  },

  s1_unfinished: {
    id: 's1_unfinished',
    text: 'He didn\'t finish. Cold Mountain teaches you not to finish sentences that don\'t need finishing.',
    type: 'narration',
    image: { src: IMG.gorge_confrontation, transition: 'crossfade', duration: 2 },
    next: 's1_tallest_speaks',
  },

  s1_tallest_speaks: {
    id: 's1_tallest_speaks',
    text: 'Now the tallest of the three speaks.',
    type: 'narration',
    audio: { action: 'fade-out', cue: 1, duration: 2 },
    next: 's1_tallest_dialogue',
  },

  s1_tallest_dialogue: {
    id: 's1_tallest_dialogue',
    text: '"We know what you carry. The letter. Give it to us and walk. You have our word."',
    type: 'dialogue',
    speaker: 'Hired Knife',
    audio: { action: 'fade-in', cue: 2, duration: 2 },
    next: 's1_his_word',
  },

  s1_his_word: {
    id: 's1_his_word',
    text: 'His word. Three hired knives in a dead-end gorge. His word.',
    type: 'narration',
    next: 's1_rain',
  },

  s1_rain: {
    id: 's1_rain',
    text: 'The rain makes soft sounds on stone. Your sword is still drawn. Cold Mountain rule: do not sheathe before the end.',
    type: 'narration',
    narrationAudio: NAR.s1_rain,
    next: 'choice1',
  },

  choice1: {
    id: 'choice1',
    text: 'CHOICE 1 — WHAT DO YOU DO WITH THE LETTER?',
    type: 'choice',
    choices: [
      {
        id: '1A',
        label: 'Hand over the letter',
        intent: 'Survive the gorge. Carry the shame later.',
        outcome: 'Your teacher\'s last instruction to you. But his first instruction — the one that shaped every day since you were a child — was to survive. You cannot deliver a letter if you are dead. You hold it out into the rain. The paper will be ruined before he reads it anyway.',
      },
      {
        id: '1B',
        label: 'Strike before he finishes speaking',
        intent: 'Trust the sword. Keep the mission alive.',
        outcome: 'He\'s been talking too long. People who are confident don\'t explain themselves to a lone disciple in the rain. They\'re afraid — of the technique, of the name Cold Mountain, of what happens if they fail. You know this because your teacher taught you to read the space between words. You step forward before he finishes his next breath.',
      },
      {
        id: '1C',
        label: 'Ask who sent them',
        intent: 'Risk the moment to uncover the deeper threat.',
        outcome: 'You lower the blade a fraction — enough to seem reasonable, not enough to seem weak. If someone knows about the letter, someone who can hire four men to wait in a gorge on a specific day, then your teacher\'s fear was not for you. It was for what happens after you leave. The question matters more than the letter.',
      },
    ],
    next: 'scene2_heading',
  },

  // ========================================================================
  // SCENE 2 · THE THIRD SHADOW
  // ========================================================================
  scene2_heading: {
    id: 'scene2_heading',
    text: 'SCENE 2 · THE THIRD SHADOW',
    type: 'scene-heading',
    sceneLabel: 'ACT I · THE DEBT',
    locationLabel: 'ONE-LINE SKY',
    moodLabel: 'AFTERMATH',
    image: { src: IMG.gorge_rescue, transition: 'crossfade', duration: 2 },
    next: 's2_opening',
  },

  s2_opening: {
    id: 's2_opening',
    text: 'You accounted for three.\n\nYou did not account for the fourth. He comes from above, where the gorge walls narrow to a strip of grey sky. The blade aimed at your exposed back. You know with the clarity of ten thousand forms that you cannot turn in time.',
    type: 'narration',
    narrationAudio: NAR.s2_three,
    next: 's2_bell',
  },

  s2_bell: {
    id: 's2_bell',
    text: 'She comes from the opposite wall — lighter, faster. There is a sound like a bell struck once. Two bodies hit the stream. Only one rises.',
    type: 'narration',
    narrationAudio: NAR.s2_bell,
    audio: { action: 'hard-mute', cue: 2 },
    next: 's2_liu_intro',
  },

  s2_liu_intro: {
    id: 's2_liu_intro',
    text: 'The woman who rises is slight. Travelling clothes the colour of old leaves. She sheathes her sword without ceremony — a breach of form that tells you she was not trained in any orthodox school. Then she sways, catches herself against the gorge wall, and her left hand comes away red.',
    type: 'narration',
    narrationAudio: NAR.s2_liu,
    audio: { action: 'fade-in', cue: 2, duration: 3, volume: 0.6 },
    next: 's2_she_turns',
  },

  s2_she_turns: {
    id: 's2_she_turns',
    text: 'She turns. She knows your face.',
    type: 'narration',
    next: 's2_liu_dialogue1',
  },

  s2_liu_dialogue1: {
    id: 's2_liu_dialogue1',
    text: '"You are Shen Mo of Cold Mountain." Not a question. "Your teacher described you well."',
    type: 'dialogue',
    speaker: 'Liu Ruyan',
    next: 's2_described',
  },

  s2_described: {
    id: 's2_described',
    text: 'Described you. To a stranger. Before you knew she existed.',
    type: 'narration',
    next: 's2_liu_dialogue2',
  },

  s2_liu_dialogue2: {
    id: 's2_liu_dialogue2',
    text: '"I am Liu Ruyan. My master waits at Falling Goose Peak. I was sent to meet you on the road and escort you there." A pause — just long enough to change what the words mean. "I was sent to take the letter, if necessary. Your teacher was not the only one who feared what it contains."',
    type: 'dialogue',
    speaker: 'Liu Ruyan',
    next: 's2_she_could',
  },

  s2_she_could: {
    id: 's2_she_could',
    text: 'She could have let the fourth man kill you. The letter would have been on your body. Easier to take from the dead than the living. Instead she is bleeding into the stream, and three men in grey are unconscious or worse, and she is waiting to see what you do with this information.',
    type: 'narration',
    next: 's2_woman',
  },

  s2_woman: {
    id: 's2_woman',
    text: 'A woman who admits to planned betrayal before it happens is either a fool or more honest than the jianghu deserves.',
    type: 'narration',
    next: 'choice2',
  },

  choice2: {
    id: 'choice2',
    text: 'CHOICE 2 — WHAT DO YOU OFFER IN RETURN?',
    type: 'choice',
    choices: [
      {
        id: '2A',
        label: 'Speak a life-debt aloud',
        intent: 'Make the debt real by giving it witnesses.',
        outcome: '"Shen Mo. I owe you a life. When you call, I come." You do not kneel — she does not seem like someone who wants kneeling — but you speak the words clearly, so the gorge walls hear them. So there are witnesses, even if the witnesses are only rain and stone. A debt spoken is a debt held.',
      },
      {
        id: '2B',
        label: 'Tend her wound in silence',
        intent: 'Let action carry what words would cheapen.',
        outcome: 'Say nothing of debt. You tear a strip from your already-ruined sleeve and press it against her side. She flinches. Does not pull away. Words of gratitude are cheap. You will remember. When the time comes, you will act. Until then, silence is a form of honesty that the jianghu has forgotten. She seems like someone who would understand that.',
      },
      {
        id: '2C',
        label: 'Ask why she saved you',
        intent: 'Refuse gratitude until the truth is named.',
        outcome: 'You do not thank her. You do not touch her. You ask the question that matters. "You could have waited. Taken the letter from my body. Why intervene?" She meets your eyes. The rain has matted her hair against her temple. She smiles — not warmly. Like someone who has been asked the right question by the wrong person.',
      },
    ],
    audio: { action: 'fade-out', cue: 2, duration: 3 },
    next: 'scene3_heading',
  },

  // ========================================================================
  // SCENE 3 · THE INN AT CROSSING-STONE
  // ========================================================================
  scene3_heading: {
    id: 'scene3_heading',
    text: 'SCENE 3 · THE INN AT CROSSING-STONE',
    type: 'scene-heading',
    sceneLabel: 'ACT I · THE DEBT',
    locationLabel: 'WATER-GAZING PAVILION',
    moodLabel: 'HALF-MOON',
    image: { src: IMG.inn_exterior, transition: 'crossfade', duration: 2 },
    audio: { action: 'fade-in', cue: 3, duration: 2 },
    next: 's3_inn',
  },

  s3_inn: {
    id: 's3_inn',
    text: 'The inn at the river crossing is called 望水楼 — Water-Gazing Pavilion — and it is a lie. You cannot see the river from any window. The innkeeper\'s wife brings boiled water and clean cloth and does not ask why a young swordsman carries a bleeding woman through her door. On the wall behind the counter, someone has carved a single line of poetry:',
    type: 'narration',
    narrationAudio: NAR.s3_inn,
    next: 's3_poem_chinese',
  },

  s3_poem_chinese: {
    id: 's3_poem_chinese',
    text: '山月不知心里事',
    type: 'blockquote',
    next: 's3_poem_english',
  },

  s3_poem_english: {
    id: 's3_poem_english',
    text: 'The mountain moon does not know the heart\'s affairs.',
    type: 'blockquote',
    next: 's3_wonder',
  },

  s3_wonder: {
    id: 's3_wonder',
    text: 'You wonder who carved it. You wonder if they survived.',
    type: 'narration',
    image: { src: IMG.carved_poem, transition: 'crossfade', duration: 1 },
    next: 's3_liu_sleeps',
  },

  s3_liu_sleeps: {
    id: 's3_liu_sleeps',
    text: 'Liu Ruyan sleeps now. The wound is not deep but it is long. She spoke little on the road, but what she said you remember:\n\nThe letter is a warning. Someone is hunting a technique — a killing art that your teacher\'s generation thought buried. Your teacher learned that it had resurfaced. He wrote to the one person who might know where.',
    type: 'narration',
    narrationAudio: NAR.s3_reflection,
    next: 's3_he_didnt',
  },

  s3_he_didnt: {
    id: 's3_he_didnt',
    text: '"He didn\'t send you to deliver a message," she said. "He sent you away from Cold Mountain. The letter was the excuse."',
    type: 'dialogue',
    speaker: 'Liu Ruyan',
    next: 's3_window',
  },

  s3_window: {
    id: 's3_window',
    text: 'You sit by the window. The moon is half-full and cold, and you are thinking about the tremor in your teacher\'s hand, the one you had never seen before, and what it means that he chose to protect you by sending you into the path of four hired knives.',
    type: 'narration',
    image: { src: IMG.inn_exterior, transition: 'crossfade', duration: 2 },
    next: 's3_courtyard',
  },

  s3_courtyard: {
    id: 's3_courtyard',
    text: 'In the courtyard below, a horse. A rider dismounts.\n\nThe voice that calls out belongs to someone you have known since you were both children trading sword-forms in the snow. 陆远 — Lu Yuan. Junior Disciple Lu. But he does not sound like a child now.',
    type: 'narration',
    narrationAudio: NAR.s3_lu,
    image: { src: IMG.lu_arrival, transition: 'crossfade', duration: 2 },
    next: 's3_senior_shen',
  },

  s3_senior_shen: {
    id: 's3_senior_shen',
    text: '"Senior Shen!"',
    type: 'dialogue',
    speaker: 'Lu Yuan',
    next: 's3_lu_description',
  },

  s3_lu_description: {
    id: 's3_lu_description',
    text: 'He is in the doorway before you rise. His robe is torn at the shoulder. His eyes are rimmed red, and he is trying very hard to speak like a sect disciple and not like a seventeen-year-old boy whose world has just ended.',
    type: 'narration',
    next: 's3_lu_teacher',
  },

  s3_lu_teacher: {
    id: 's3_lu_teacher',
    text: '"Teacher — the sect — there was an attack. Two nights ago. They came at dusk. Teacher held the gate. Teacher —"',
    type: 'dialogue',
    speaker: 'Lu Yuan',
    next: 's3_he_stops',
  },

  s3_he_stops: {
    id: 's3_he_stops',
    text: 'He stops. Swallows.',
    type: 'narration',
    next: 's3_they_say',
  },

  s3_they_say: {
    id: 's3_they_say',
    text: '"They\'re saying he\'s not going to — they\'re saying you need to come home. Now. The elders are already — please, Senior Shen. Please."',
    type: 'dialogue',
    speaker: 'Lu Yuan',
    next: 's3_behind',
  },

  s3_behind: {
    id: 's3_behind',
    text: 'Behind you, in the room, Liu Ruyan stirs. You hear it — the sound of someone waking to pain, and to the fragment of a conversation that will determine whether the person who saved her life stays or goes.',
    type: 'narration',
    next: 's3_moon',
  },

  s3_moon: {
    id: 's3_moon',
    text: 'The mountain moon does not know the heart\'s affairs.',
    type: 'narration',
    next: 'choice3',
  },

  choice3: {
    id: 'choice3',
    text: 'CHOICE 3 — WHAT DO YOU DO?',
    type: 'choice',
    choices: [
      {
        id: '3A',
        label: 'Ride for Cold Mountain now',
        intent: 'Choose sect and teacher before all debts.',
        outcome: 'Your teacher is dying. Your sect is broken. Your sect-brother is seventeen and terrified and trying to hold himself together in a stranger\'s inn. Liu Ruyan is stable — the innkeeper\'s wife will tend her. You leave a note. It is not enough. You know this. You leave it anyway. The moon is cold and indifferent and exactly as it has always been.',
      },
      {
        id: '3B',
        label: 'Stay until dawn',
        intent: 'Give the woman who bled for you a waking farewell.',
        outcome: 'Whatever has happened on Cold Mountain has already happened. A few hours will change nothing for your teacher. But the woman who bled for you deserves a waking farewell. You tell Lu Yuan to rest the horse and wait. When Liu Ruyan opens her eyes, you are still there. She does not thank you. She doesn\'t need to.',
      },
      {
        id: '3C',
        label: 'Bring her with you',
        intent: 'Make the impossible choice — both debt and duty.',
        outcome: 'You cannot leave her alone in a river inn with a wound and four dead men\'s allies somewhere behind you. And you cannot abandon your teacher. So you make the impossible choice — both. You wake her gently. Explain. She is too weak to ride alone. You share a horse. Lu Yuan rides ahead. The three of you travel through the night, and no one speaks, because there is nothing to say that would make any of this easier.',
      },
    ],
    audio: { action: 'fade-out', cue: 3, duration: 3 },
    next: 'act1_end',
  },

  // ========================================================================
  // POST-CHOICE 3 CALLBACK BRANCHES
  // ========================================================================
  // Callback 1: Choice 3A path — Lu Yuan hesitation reference (if A1 or C1)
  callback_3a_lu: {
    id: 'callback_3a_lu',
    text: 'Junior Disciple Lu looks at you with an expression you cannot read. "You left the letter behind," he says, barely audible. "You hesitated. And now —" He does not finish. Cold Mountain teaches you not to finish sentences that don\'t need finishing.',
    type: 'narration',
    next: 'act1_end',
  },

  // Callback 2: Choice 3B path — Liu Ruyan "one of those" intonation variant
  // If B2 is true, the line carries recognition; otherwise it's flat
  callback_3b_liu: {
    id: 'callback_3b_liu',
    text: 'In the grey pre-dawn light, she says only: "So you\'re one of those." You don\'t ask what she means.',
    type: 'narration',
    next: 'act1_end',
  },

  // Callback 2 variant: recognition intonation (B2 flag true — you tended her wound silently)
  callback_3b_liu_recognition: {
    id: 'callback_3b_liu_recognition',
    text: 'In the grey pre-dawn light, she says only: "So you\'re one of those." But the way she says it — with the faintest tilt of her head, the ghost of something almost warm — tells you she recognises what you did. Not the wound. The silence. She has met people who trade debts before. She did not expect someone who would simply act and ask nothing. You don\'t ask what she means. You think, perhaps, you already know.',
    type: 'narration',
    next: 'act1_end',
  },

  // Callback 3: Choice 3C path — "You ask too many questions" (if C3 and C2)
  callback_3c_too_many: {
    id: 'callback_3c_too_many',
    text: 'Halfway through the ride, Liu Ruyan speaks into the dark. "You ask too many questions." It is almost fond.',
    type: 'narration',
    next: 'act1_end',
  },

  // ========================================================================
  // END OF ACT 1
  // ========================================================================
  act1_end: {
    id: 'act1_end',
    text: 'END OF ACT 1',
    type: 'ending',
    image: { src: IMG.ending, transition: 'crossfade', duration: 2 },
  },
};
