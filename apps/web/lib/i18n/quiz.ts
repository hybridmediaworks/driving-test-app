// Static UI-chrome translations for the quiz-taking screen (sidebar, buttons, dialogs, toasts).
// Deliberately NOT the same pipeline as the AI-translated question/answer content
// (TranslateQuizContent on the API side) — this is a small, fixed set of strings that never
// changes per-quiz, so a plain dictionary is cheaper, instant, and reviewable, unlike the
// per-question LLM translation used for actual DMV content.

export type QuizLanguage = "en" | "es" | "ru";

const en = {
  exit: "Exit",
  practiceBadge: "Practice",
  upgrade: "Upgrade",
  upgradeToPremium: "Upgrade to Premium",
  premiumQuizNotice: "This test is a premium test. Upgrade to unlock it.",
  loadingTest: "Loading test…",
  testUnavailable: "This test isn't available right now.",
  testHasNoQuestions: "This test doesn't have any questions yet.",

  yourProgress: "Your Progress",
  allowedToFail: "{count} allowed to pass",
  restart: "Restart",
  all: "All",
  correct: "Correct",
  incorrect: "Incorrect",
  flagged: "Flagged",

  voiceOver: "Voice over",
  answerPopularity: "Answer popularity",
  ambientMusic: "Ambient music",
  fontSize: "Font size",
  default: "Default",
  keyboardShortcuts: "Keyboard shortcuts",
  translatingQuiz: "Translating this quiz — this can take a little while the first time…",
  machineTranslatedNotice: "Machine-translated — verify with an official source before your exam.",

  flagForMistake: "Flag for Mistake",
  previous: "Previous",
  nextQuestion: "Next Question",
  seeResults: "See Results",
  grading: "Grading…",

  translationNotReadyToast: "Translation isn't ready for this quiz yet — showing English for now.",
  translationFailedToast: "Couldn't translate this quiz right now — showing English.",
  submitFailedError: "Failed to submit your answers. Please try again.",

  correctAnswerBadge: "Correct answer",
  yourAnswerBadge: "Your answer",

  perfectScoreTitle: "Perfect score",
  perfectScoreSub: "Flawless run — you nailed every question.",
  passedTitle: "Passed",
  passedSub: "Above the passing line. You're test-ready on this set.",
  almostThereTitle: "Almost there",
  almostThereSub: "Close to passing — tighten up the misses and go again.",
  keepPracticingTitle: "Keep practicing",
  keepPracticingSub: "Review the missed rules and retry to build your streak.",
  correctOfTotal: "{correct} of {total} correct",
  progressUnlocked: "Progress unlocked",
  leveledUpBadge: "Leveled up your {badge} badge — {note}.",
  badgeBronzeMarathoner: "Bronze Marathoner",
  badgeRoadScholar: "Road Scholar",
  badgeNoteNiceWork: "nice work",
  badgeNoteKeepItUp: "keep it up",
  retryMissedQuestions: "Retry {count} missed question{plural}",
  continueLabel: "Continue",

  hintPrompt: "Need a hint or a quick explanation? Tap the button or type a question for instant help.",
  hintBadge: "Hint",
  getAHint: "Get a Hint",
  askYourQuestionPlaceholder: "Ask your question here",
  aiTutorUnavailable: "The AI tutor is unavailable right now.",

  restartTestTitle: "Restart your test?",
  restartTestBody: "Are you sure you want to restart your test? Your test progress will be lost.",
  cancel: "Cancel",

  reportMistakeTitle: "Report a mistake in this question",
  reportMistakeInstructions:
    'Please check the box with the mistake or typo and provide a comment in the form below. Remember to read through the hint and explanation (check for words like "NOT" and "EXCEPT"), and double-check your answer. Thanks for your help!',
  questionLabel: "Question:",
  signOrImage: "Sign / Image",
  answersLabel: "Answers:",
  hintLabel: "Hint:",
  hintExplanationCheckbox: "The hint / explanation for this question",
  describeWhatIsWrong: "Please describe what is wrong with the sentence you have ticked:",
  enterYourName: "Enter your name",
  enterYourEmail: "Enter your e-mail address",
  send: "Send",
  sending: "Sending…",
  describeBeforeSending: "Please describe the mistake before sending.",
  reportSubmitted: "Thanks! Your report has been submitted.",
  reportFailed: "Couldn't send your report. Please try again.",

  streakLegendary: "Legendary!",
  streakUnstoppable: "Unstoppable!",
  streakOnFire: "On fire!",
  streakOnARoll: "You're on a roll!",
  streakNice: "Nice streak!",
  streakInARow: "{count} in a row",
};

const es: Record<keyof typeof en, string> = {
  exit: "Salir",
  practiceBadge: "Práctica",
  upgrade: "Mejorar",
  upgradeToPremium: "Actualizar a Premium",
  premiumQuizNotice: "Este es un examen premium. Actualiza tu plan para desbloquearlo.",
  loadingTest: "Cargando examen…",
  testUnavailable: "Este examen no está disponible en este momento.",
  testHasNoQuestions: "Este examen todavía no tiene preguntas.",

  yourProgress: "Tu Progreso",
  allowedToFail: "Se permiten {count} errores",
  restart: "Reiniciar",
  all: "Todas",
  correct: "Correctas",
  incorrect: "Incorrectas",
  flagged: "Marcadas",

  voiceOver: "Voz en off",
  answerPopularity: "Popularidad de respuestas",
  ambientMusic: "Música ambiental",
  fontSize: "Tamaño de fuente",
  default: "Predeterminado",
  keyboardShortcuts: "Atajos de teclado",
  translatingQuiz: "Traduciendo este examen — la primera vez puede tardar un poco…",
  machineTranslatedNotice: "Traducido por IA — verifica con una fuente oficial antes de tu examen.",

  flagForMistake: "Reportar un error",
  previous: "Anterior",
  nextQuestion: "Siguiente pregunta",
  seeResults: "Ver resultados",
  grading: "Calificando…",

  translationNotReadyToast: "La traducción de este examen aún no está lista — mostrando inglés por ahora.",
  translationFailedToast: "No se pudo traducir este examen ahora — mostrando inglés.",
  submitFailedError: "No se pudieron enviar tus respuestas. Inténtalo de nuevo.",

  correctAnswerBadge: "Respuesta correcta",
  yourAnswerBadge: "Tu respuesta",

  perfectScoreTitle: "Puntaje perfecto",
  perfectScoreSub: "Ronda perfecta — acertaste todas las preguntas.",
  passedTitle: "Aprobado",
  passedSub: "Por encima del puntaje mínimo. Estás listo para este examen.",
  almostThereTitle: "Casi lo logras",
  almostThereSub: "Cerca de aprobar — repasa lo que fallaste e inténtalo de nuevo.",
  keepPracticingTitle: "Sigue practicando",
  keepPracticingSub: "Repasa las reglas que fallaste y vuelve a intentarlo para ganar racha.",
  correctOfTotal: "{correct} de {total} correctas",
  progressUnlocked: "Progreso desbloqueado",
  leveledUpBadge: "Subiste de nivel tu insignia {badge} — {note}.",
  badgeBronzeMarathoner: "Maratonista de Bronce",
  badgeRoadScholar: "Erudito Vial",
  badgeNoteNiceWork: "buen trabajo",
  badgeNoteKeepItUp: "sigue así",
  retryMissedQuestions: "Reintentar {count} pregunta{plural} fallada{plural}",
  continueLabel: "Continuar",

  hintPrompt: "¿Necesitas una pista o una explicación rápida? Toca el botón o escribe una pregunta para ayuda instantánea.",
  hintBadge: "Pista",
  getAHint: "Obtener una pista",
  askYourQuestionPlaceholder: "Escribe tu pregunta aquí",
  aiTutorUnavailable: "El tutor de IA no está disponible en este momento.",

  restartTestTitle: "¿Reiniciar tu examen?",
  restartTestBody: "¿Estás seguro de que quieres reiniciar tu examen? Se perderá tu progreso.",
  cancel: "Cancelar",

  reportMistakeTitle: "Reportar un error en esta pregunta",
  reportMistakeInstructions:
    'Marca la casilla con el error o la errata y deja un comentario en el formulario de abajo. Recuerda leer bien la pista y la explicación (fíjate en palabras como "NO" y "EXCEPTO"), y revisa tu respuesta. ¡Gracias por tu ayuda!',
  questionLabel: "Pregunta:",
  signOrImage: "Señal / Imagen",
  answersLabel: "Respuestas:",
  hintLabel: "Pista:",
  hintExplanationCheckbox: "La pista / explicación de esta pregunta",
  describeWhatIsWrong: "Describe qué está mal en lo que marcaste:",
  enterYourName: "Ingresa tu nombre",
  enterYourEmail: "Ingresa tu correo electrónico",
  send: "Enviar",
  sending: "Enviando…",
  describeBeforeSending: "Describe el error antes de enviarlo.",
  reportSubmitted: "¡Gracias! Tu reporte ha sido enviado.",
  reportFailed: "No se pudo enviar tu reporte. Inténtalo de nuevo.",

  streakLegendary: "¡Legendario!",
  streakUnstoppable: "¡Imparable!",
  streakOnFire: "¡En racha!",
  streakOnARoll: "¡Vas muy bien!",
  streakNice: "¡Buena racha!",
  streakInARow: "{count} seguidas",
};

const ru: Record<keyof typeof en, string> = {
  exit: "Выйти",
  practiceBadge: "Практика",
  upgrade: "Улучшить",
  upgradeToPremium: "Перейти на Premium",
  premiumQuizNotice: "Это премиум-тест. Оформите подписку, чтобы получить доступ.",
  loadingTest: "Загрузка теста…",
  testUnavailable: "Этот тест сейчас недоступен.",
  testHasNoQuestions: "В этом тесте пока нет вопросов.",

  yourProgress: "Ваш прогресс",
  allowedToFail: "Допускается {count} ошибок",
  restart: "Начать заново",
  all: "Все",
  correct: "Верные",
  incorrect: "Неверные",
  flagged: "Отмеченные",

  voiceOver: "Озвучка",
  answerPopularity: "Популярность ответов",
  ambientMusic: "Фоновая музыка",
  fontSize: "Размер шрифта",
  default: "По умолчанию",
  keyboardShortcuts: "Горячие клавиши",
  translatingQuiz: "Перевод теста — в первый раз это может занять некоторое время…",
  machineTranslatedNotice: "Машинный перевод — перед экзаменом сверьтесь с официальным источником.",

  flagForMistake: "Сообщить об ошибке",
  previous: "Назад",
  nextQuestion: "Следующий вопрос",
  seeResults: "Показать результаты",
  grading: "Проверка…",

  translationNotReadyToast: "Перевод этого теста ещё не готов — пока показан английский.",
  translationFailedToast: "Не удалось перевести этот тест сейчас — показан английский.",
  submitFailedError: "Не удалось отправить ваши ответы. Попробуйте ещё раз.",

  correctAnswerBadge: "Правильный ответ",
  yourAnswerBadge: "Ваш ответ",

  perfectScoreTitle: "Идеальный результат",
  perfectScoreSub: "Безупречно — все ответы верны.",
  passedTitle: "Сдано",
  passedSub: "Выше проходного балла. Вы готовы к этому тесту.",
  almostThereTitle: "Почти получилось",
  almostThereSub: "Близко к проходному баллу — повторите ошибки и попробуйте снова.",
  keepPracticingTitle: "Продолжайте тренироваться",
  keepPracticingSub: "Повторите пропущенные правила и попробуйте снова, чтобы набрать серию.",
  correctOfTotal: "{correct} из {total} верно",
  progressUnlocked: "Прогресс разблокирован",
  leveledUpBadge: "Повышен уровень значка «{badge}» — {note}.",
  badgeBronzeMarathoner: "Бронзовый марафонец",
  badgeRoadScholar: "Знаток дорог",
  badgeNoteNiceWork: "отличная работа",
  badgeNoteKeepItUp: "так держать",
  retryMissedQuestions: "Повторить {count} пропущенных вопросов",
  continueLabel: "Продолжить",

  hintPrompt: "Нужна подсказка или быстрое объяснение? Нажмите кнопку или введите вопрос для мгновенной помощи.",
  hintBadge: "Подсказка",
  getAHint: "Получить подсказку",
  askYourQuestionPlaceholder: "Введите ваш вопрос здесь",
  aiTutorUnavailable: "ИИ-репетитор сейчас недоступен.",

  restartTestTitle: "Начать тест заново?",
  restartTestBody: "Вы уверены, что хотите начать тест заново? Прогресс теста будет потерян.",
  cancel: "Отмена",

  reportMistakeTitle: "Сообщить об ошибке в этом вопросе",
  reportMistakeInstructions:
    "Отметьте пункт с ошибкой или опечаткой и оставьте комментарий в форме ниже. Не забудьте внимательно прочитать подсказку и объяснение (обратите внимание на слова «НЕ» и «КРОМЕ») и перепроверить свой ответ. Спасибо за помощь!",
  questionLabel: "Вопрос:",
  signOrImage: "Знак / Изображение",
  answersLabel: "Ответы:",
  hintLabel: "Подсказка:",
  hintExplanationCheckbox: "Подсказка / объяснение к этому вопросу",
  describeWhatIsWrong: "Опишите, что не так в отмеченном пункте:",
  enterYourName: "Введите ваше имя",
  enterYourEmail: "Введите ваш email",
  send: "Отправить",
  sending: "Отправка…",
  describeBeforeSending: "Опишите ошибку перед отправкой.",
  reportSubmitted: "Спасибо! Ваш отчёт отправлен.",
  reportFailed: "Не удалось отправить отчёт. Попробуйте ещё раз.",

  streakLegendary: "Легендарно!",
  streakUnstoppable: "Не остановить!",
  streakOnFire: "В ударе!",
  streakOnARoll: "Отличная серия!",
  streakNice: "Хорошая серия!",
  streakInARow: "{count} подряд",
};

const dictionaries: Record<QuizLanguage, Record<keyof typeof en, string>> = { en, es, ru };

export type QuizTranslationKey = keyof typeof en;

// The shape of a `translate` call already bound to a language — what components actually receive
// as a prop, so they don't need to know the language or import `translate` themselves.
export type TFunction = (key: QuizTranslationKey, vars?: Record<string, string | number>) => string;

/**
 * Looks up `key` in `language`'s dictionary (falling back to English for a missing key — should
 * never happen since `es`/`ru` are typed against the same key set as `en`, but keeps this
 * defensive rather than throwing). `{placeholder}` tokens in the string are replaced from `vars`.
 */
export function translate(
  language: QuizLanguage,
  key: QuizTranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{${k}}`, String(v)), template);
}
