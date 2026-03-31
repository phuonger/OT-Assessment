// Sensory Profile 2 Assessment Data
// Auto-generated from Excel template

export interface SP2Item {
  number: number;
  quadrant: string;
  description: string;
}

export interface SP2Section {
  id: string;
  name: string;
  ageRange: string;
  prompt: string;
  items: SP2Item[];
}

export const SP2_RESPONSE_OPTIONS = [
  { value: 5, label: 'Almost Always', description: '90% or more of the time' },
  { value: 4, label: 'Frequently', description: 'About 75% of the time' },
  { value: 3, label: 'Half the Time', description: 'About 50% of the time' },
  { value: 2, label: 'Occasionally', description: 'About 25% of the time' },
  { value: 1, label: 'Almost Never', description: '10% or less of the time' },
  { value: 0, label: 'Does Not Apply', description: 'N/A' },
];

export const SP2_RESPONSE_OPTIONS_SPANISH = [
  { value: 5, label: 'Casi siempre', description: '90% o mas del tiempo' },
  { value: 4, label: 'Frecuentemente', description: 'Alrededor del 75% del tiempo' },
  { value: 3, label: 'La mitad del tiempo', description: 'Alrededor del 50% del tiempo' },
  { value: 2, label: 'Ocasionalmente', description: 'Alrededor del 25% del tiempo' },
  { value: 1, label: 'Casi nunca', description: '10% o menos del tiempo' },
  { value: 0, label: 'No aplicable', description: 'N/A' },
];

export const SP2_BIRTH6MO_ITEMS: SP2Item[] = [
  { number: 1, quadrant: 'R.G.', description: 'stays quiet and calm in an active setting compared to other babies.' },
  { number: 2, quadrant: 'R.G.', description: 'is unaware of people coming in or leaving the room.' },
  { number: 3, quadrant: 'S.N.', description: 'needs the same routine to stay content and calm.' },
  { number: 4, quadrant: '', description: 'acts in a way that interferes with family schedules and plans.' },
  { number: 5, quadrant: 'S.N.', description: 'requires help to get to sleep.' },
  { number: 6, quadrant: 'S.N.', description: 'is irritable compared to other babies.' },
  { number: 7, quadrant: '', description: 'sleeps more than other babies.' },
  { number: 8, quadrant: 'R.G.', description: 'only pays attention when I touch my baby (and hearing is OK).' },
  { number: 9, quadrant: 'S.K.', description: 'enjoys making mouth sounds (for example, blowing raspberries, making noises with lips, humming).' },
  { number: 10, quadrant: '', description: 'ignores me when I am talking.' },
  { number: 11, quadrant: '', description: 'becomes upset by sudden everyday sounds.' },
  { number: 12, quadrant: 'S.K.', description: 'becomes more animated and engaged around music, talking, or sound toys.' },
  { number: 13, quadrant: 'A.V.', description: 'misses eye contact with me during everyday interactions.' },
  { number: 14, quadrant: 'A.V.', description: 'looks away from toys or faces.' },
  { number: 15, quadrant: 'A.V.', description: 'looks away or becomes restless in noisy settings or with noisy toys.' },
  { number: 16, quadrant: 'S.N.', description: 'blinks a lot when objects or people come close to face.' },
  { number: 17, quadrant: '', description: 'becomes upset when having nails trimmed.' },
  { number: 18, quadrant: 'S.N.', description: 'needs to be swaddled or wrapped to relax.' },
  { number: 19, quadrant: 'S.N.', description: 'is startled by texture differences (for example, on grass, on carpet, on blankets).' },
  { number: 20, quadrant: 'S.K.', description: 'enjoys rhythmical activities (for example, swinging, rocking, car rides).' },
  { number: 21, quadrant: 'A.V.', description: 'resists having head tipped back during bathing.' },
  { number: 22, quadrant: '', description: 'cries or fusses with everyday movement.' },
  { number: 23, quadrant: 'R.G.', description: 'needs more head support when being held compared to other babies.' },
  { number: 24, quadrant: '', description: 'struggles to close mouth when feeding from the breast or bottle (for example, doesn\'t latch on).' },
  { number: 25, quadrant: 'S.K.', description: 'enjoys making movements or sounds with mouth.' },
];

export const SP2_ENGLISH_ITEMS: SP2Item[] = [
  { number: 1, quadrant: 'S.N.', description: 'needs a routine to stay content or calm.' },
  { number: 2, quadrant: 'S.N.', description: 'acts in a way that interferes with family schedules and plans.' },
  { number: 3, quadrant: 'A.V.', description: 'resists playing among other children.' },
  { number: 4, quadrant: '', description: 'takes longer than same-aged children to respond to questions or actions.' },
  { number: 5, quadrant: '', description: 'withdraws from situations.' },
  { number: 6, quadrant: '', description: 'has an unpredictable sleeping pattern.' },
  { number: 7, quadrant: '', description: 'has an unpredictable eating pattern.' },
  { number: 8, quadrant: '', description: 'is easily awakened.' },
  { number: 9, quadrant: 'R.G.', description: 'misses eye contact with me during everyday interactions.' },
  { number: 10, quadrant: 'A.V.', description: 'gets anxious in new situations.' },
  { number: 11, quadrant: 'R.G.', description: 'only pays attention if I speak loudly.' },
  { number: 12, quadrant: 'R.G.', description: 'only pays attention when I touch my child (and hearing is OK) .' },
  { number: 13, quadrant: 'S.N.', description: 'startles easily at sound compared to same-aged children (for example, dog barking, children shouting).' },
  { number: 14, quadrant: 'R.G.', description: 'is distracted in noisy settings.' },
  { number: 15, quadrant: 'R.G.', description: 'ignores sounds, including my voice.' },
  { number: 16, quadrant: 'S.N.', description: 'becomes upset or tries to escape from noisy settings.' },
  { number: 17, quadrant: '', description: 'takes a long time to respond to own name.' },
  { number: 18, quadrant: 'S.K.', description: 'enjoys looking at moving or spinning objects (for example, ceiling fans, toys with wheels).' },
  { number: 19, quadrant: 'S.K.', description: 'enjoys looking at shiny objects.' },
  { number: 20, quadrant: 'S.K.', description: 'is attracted to 1V or computer screens with fast-paced, brightly colored graphics.' },
  { number: 21, quadrant: '', description: 'startles at bright or unpredictable light (for example, when moving from inside to outside).' },
  { number: 22, quadrant: '', description: 'is bothered by bright lights (for example, hides from sunlight through car window).' },
  { number: 23, quadrant: 'R.G.', description: 'is more bothered by bright lights than other same-aged children.' },
  { number: 24, quadrant: 'R.G.', description: 'pushes brightly colored toys away. *' },
  { number: 25, quadrant: 'R.G.', description: 'fails to respond to self in mirror. *' },
  { number: 26, quadrant: 'S.N.', description: 'becomes upset when having nails trimmed.' },
  { number: 27, quadrant: 'A.V.', description: 'resists being cuddled.' },
  { number: 28, quadrant: 'A.V.', description: 'is upset when moving among spaces with very different temperatures (for example, colder, warmer).' },
  { number: 29, quadrant: 'A.V.', description: 'withdraws from contact with rough, cold, or sticky surfaces (for example, carpet, countertops).' },
  { number: 30, quadrant: 'R.G.', description: 'bumps into things, failing to notice objects or people in the way.' },
  { number: 31, quadrant: 'S.N.', description: 'pulls at clothing or resists getting clothing on.' },
  { number: 32, quadrant: 'S.K.', description: 'enjoys splashing during bath or swim time.*' },
  { number: 33, quadrant: 'A.V.', description: 'becomes upset if own clothing, hands, or face are messy.*' },
  { number: 34, quadrant: 'S.N.', description: 'becomes anxious when walking or crawling on certain surfaces (for example, grass, sand, carpet, tile).*' },
  { number: 35, quadrant: 'A.V.', description: 'withdraws from unexpected touch .*' },
  { number: 36, quadrant: 'S.K.', description: 'enjoys physical activity (for example, bouncing, being held up high in the air).' },
  { number: 37, quadrant: 'S.K.', description: 'enjoys rhythmical activities (for example, swinging, rocking, car rides).' },
  { number: 38, quadrant: 'S.K.', description: 'takes movement or climbing risks.' },
  { number: 39, quadrant: 'S.N.', description: 'becomes upset when placed on the back (for example, at changing times).' },
  { number: 40, quadrant: 'R.G.', description: 'seems accident-prone or clumsy.' },
  { number: 41, quadrant: 'S.N.', description: 'fusses when moved around (for example, walking around, when being handed over to another person).*' },
  { number: 42, quadrant: 'A.V.', description: 'shows a clear dislike for all but a few food choices.' },
  { number: 43, quadrant: '', description: 'drools.' },
  { number: 44, quadrant: 'S.N.', description: 'prefers one texture of food (for example, smooth, crunchy}.' },
  { number: 45, quadrant: 'R.G.', description: 'uses drinking to calm self.' },
  { number: 46, quadrant: 'S.N.', description: 'gags on foods or drink.' },
  { number: 47, quadrant: '', description: 'holds food in cheeks before swallowing.' },
  { number: 48, quadrant: 'S.N.', description: 'has difficulty weaning to chunky foods.' },
  { number: 49, quadrant: 'A.V.', description: 'has temper tantrums.' },
  { number: 50, quadrant: '', description: 'is clingy.' },
  { number: 51, quadrant: '', description: 'stays calm only when being held.' },
  { number: 52, quadrant: 'S.N.', description: 'is fussy or irritable.' },
  { number: 53, quadrant: 'A.V.', description: 'is bothered by new settings.' },
  { number: 54, quadrant: '', description: 'becomes so upset in new settings that it\'s hard to calm down.' },
];

export const SP2_SPANISH_ITEMS: SP2Item[] = [
  { number: 1, quadrant: 'S.N.', description: 'necesita una rutina para quedarse contento(a) o calmado(a).' },
  { number: 2, quadrant: 'S.N.', description: 'actúa en una forma que interfiere con los programas y planes de la familia.' },
  { number: 3, quadrant: 'A.V.', description: 'se resiste a jugar con otros niños(as).' },
  { number: 4, quadrant: '', description: 'toma más tiempo que otros niños(as) de su misma edad para responder a preguntas o acciones.' },
  { number: 5, quadrant: '', description: 'se retira de situaciones.' },
  { number: 6, quadrant: '', description: 'tiene un patrón de sueño impredecible.' },
  { number: 7, quadrant: '', description: 'tiene un patrón impredecible para comer.' },
  { number: 8, quadrant: '', description: 'se despierta fácilmente.' },
  { number: 9, quadrant: 'R.G.', description: 'tiene muy poco contacto visual conmigo durante nuestras interacciones diarias.' },
  { number: 10, quadrant: 'A.V.', description: 'se pone ansioso(a) ante situaciones nuevas.' },
  { number: 11, quadrant: 'R.G.', description: 'solo me pone atención cuando le hablo en voz alta.' },
  { number: 12, quadrant: 'R.G.', description: 'solo me pone atención cuando lo(a) toco (a pesar de que puede oír bien).' },
  { number: 13, quadrant: 'S.N.', description: 'se sobresalta con el ruido más fácilmente que otros niños(as) de su edad (por ejemplo, perros ladrando, niños(as) gritando).' },
  { number: 14, quadrant: 'R.G.', description: 'se distrae en ambientes ruidosos.' },
  { number: 15, quadrant: 'R.G.', description: 'ignora los sonidos, incluyendo mi voz.' },
  { number: 16, quadrant: 'S.N.', description: 'se disgusta o trata de escapar de los ambientes ruidosos.' },
  { number: 17, quadrant: '', description: 'toma mucho tiempo para responder cuando le llaman por su nombre.' },
  { number: 18, quadrant: 'S.K.', description: 'disfruta viendo objetos que se mueven o giran (por ejemplo, abanicos de techo, juguetes con ruedas).' },
  { number: 19, quadrant: 'S.K.', description: 'disfruta viendo objetos brillantes.' },
  { number: 20, quadrant: 'S.K.', description: 'tiene atracción por las pantallas de televisión o computadora con gráficas brillantes de colores y con movimientos rápidos.' },
  { number: 21, quadrant: '', description: 'se sobresalta con la luz brillante o impredecible (por ejemplo, al salir del interior al exterior).' },
  { number: 22, quadrant: '', description: 'le molestan las luces brillantes (por ejemplo, se esconde de la luz del sol que entra por la ventana del automóvil).' },
  { number: 23, quadrant: 'R.G.', description: 'le molestan las luces brillantes más que a otros niños(as) de su misma edad.' },
  { number: 24, quadrant: 'R.G.', description: 'empuja los juguetes de colores brillantes alejándolos de él(ella).*' },
  { number: 25, quadrant: 'R.G.', description: 'falla en responder a sí mismo(a) en el espejo.*' },
  { number: 26, quadrant: 'S.N.', description: 'se disgusta cuando le cortan las uñas.' },
  { number: 27, quadrant: 'A.V.', description: 'se resiste a que lo(a) abracen.' },
  { number: 28, quadrant: 'A.V.', description: 'se disgusta cuando se mueve entre lugares con temperaturas muy diferentes (por ejemplo, más frío, más caliente).' },
  { number: 29, quadrant: 'A.V.', description: 'se aleja de superficies ásperas, frías o pegajosas para no hacer contacto con ellas (por ejemplo, alfombra, mesa).' },
  { number: 30, quadrant: 'R.G.', description: 'choca con las cosas, sin darse cuenta de los objetos o personas que están en su camino.' },
  { number: 31, quadrant: 'S.N.', description: 'se jalonea la ropa o se resiste a que lo(a) vistan.' },
  { number: 32, quadrant: 'S.K.', description: 'disfruta de salpicar agua durante el baño o cuando nada.*' },
  { number: 33, quadrant: 'A.V.', description: 'se disgusta si su ropa, manos o cara están sucias.*' },
  { number: 34, quadrant: 'S.N.', description: 'se pone ansioso(a) cuando camina o gatea en ciertas superficies (por ejemplo, pasto/zacate, arena, alfombra, mosaico).*' },
  { number: 35, quadrant: 'A.V.', description: 'se aparta si lo(a) tocan inesperadamente.*' },
  { number: 36, quadrant: 'S.K.', description: 'disfruta de las actividades físicas (por ejemplo, saltar, que lo(a) levanten en el aire).' },
  { number: 37, quadrant: 'S.K.', description: 'disfruta de las actividades rítmicas (por ejemplo, columpiarse, mecerse, paseos en automóvil).' },
  { number: 38, quadrant: 'S.K.', description: 'toma riesgos al trepar/escalar o hacer movimientos.' },
  { number: 39, quadrant: 'S.N.', description: 'se disgusta cuando lo(a) ponen de espalda (por ejemplo, para cambiarle los pañales).' },
  { number: 40, quadrant: 'R.G.', description: 'parece torpe o propenso(a) a los accidentes.' },
  { number: 41, quadrant: 'S.N.', description: 'se queja cuando lo(a) mueven (por ejemplo, hacerlo(a) caminar, cuando lo(a) pasan de una persona a otra).*' },
  { number: 42, quadrant: 'A.V.', description: 'muestra un claro disgusto a toda clase de comida con la excepción de unos cuantos alimentos.' },
  { number: 43, quadrant: '', description: 'babea.' },
  { number: 44, quadrant: 'S.N.', description: 'prefiere una textura particular de comida (por ejemplo, suave, crujiente).' },
  { number: 45, quadrant: 'R.G.', description: 'toma líquidos para calmarse a sí mismo(a).' },
  { number: 46, quadrant: 'S.N.', description: 'tiene el reflejo de vómito con la comida o bebida.' },
  { number: 47, quadrant: '', description: 'detiene la comida en los cachetes antes de tragar.' },
  { number: 48, quadrant: 'S.N.', description: 'le cuesta trabajo acostumbrarse a la comida con pedazos sólidos.' },
  { number: 49, quadrant: 'A.V.', description: 'hace berrinches.' },
  { number: 50, quadrant: '', description: 'es muy apegado(a) a mí.' },
  { number: 51, quadrant: '', description: 'permanece calmado(a) solo cuando lo(a) sostienen.' },
  { number: 52, quadrant: 'S.N.', description: 'es quejumbroso(a) o irritable.' },
  { number: 53, quadrant: 'A.V.', description: 'le molestan los ambientes nuevos.' },
  { number: 54, quadrant: '', description: 'se pone tan disgustado(a) en ambientes nuevos que le cuesta trabajo calmarse.' },
];

export const SP2_SECTIONS: SP2Section[] = [
  {
    id: 'birth6mo',
    name: 'Sensory Profile 2 (Birth-6mo)',
    ageRange: 'Birth to 6 Months',
    prompt: 'My baby...',
    items: SP2_BIRTH6MO_ITEMS,
  },
  {
    id: 'english',
    name: 'Sensory Profile 2 (English)',
    ageRange: '7+ Months',
    prompt: 'My child...',
    items: SP2_ENGLISH_ITEMS,
  },
  {
    id: 'spanish',
    name: 'Sensory Profile 2 (Spanish)',
    ageRange: '7+ Months',
    prompt: 'Mi nino(a)...',
    items: SP2_SPANISH_ITEMS,
  },
];

// Scoring cutoffs for Birth-6mo
export const SP2_BIRTH6MO_CUTOFFS: Record<string, { maxScore: number; cutoffs: { muchLess: number; less: number; justLike: number; more: number; muchMore: number } }> = {
  'general': { maxScore: 50, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
  'auditory': { maxScore: 35, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
  'visual': { maxScore: 30, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
  'touch': { maxScore: 30, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
  'movement': { maxScore: 25, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
  'oralsensory': { maxScore: 35, cutoffs: { muchLess: 0, less: 31, justLike: 41, more: 62, muchMore: 72 } },
};

// Scoring cutoffs for English (7+ months)
export const SP2_ENGLISH_CUTOFFS = {
  quadrants: {
    seeking: { maxScore: 35, cutoffs: { muchLess: 0, less: 18, justLike: 23, more: 34, muchMore: 35 } },
    avoiding: { maxScore: 55, cutoffs: { muchLess: 0, less: 6, justLike: 11, more: 22, muchMore: 27 } },
    sensitivity: { maxScore: 65, cutoffs: { muchLess: 0, less: 7, justLike: 13, more: 28, muchMore: 35 } },
    registration: { maxScore: 55, cutoffs: { muchLess: 0, less: 4, justLike: 10, more: 22, muchMore: 27 } },
  },
  sections: {
    general: { maxScore: 50, cutoffs: { muchLess: 0, less: 6, justLike: 11, more: 23, muchMore: 28 } },
    auditory: { maxScore: 35, cutoffs: { muchLess: 0, less: 3, justLike: 6, more: 15, muchMore: 18 } },
    visual: { maxScore: 30, cutoffs: { muchLess: 0, less: 6, justLike: 11, more: 20, muchMore: 25 } },
    touch: { maxScore: 30, cutoffs: { muchLess: 0, less: 2, justLike: 6, more: 14, muchMore: 17 } },
    movement: { maxScore: 25, cutoffs: { muchLess: 0, less: 10, justLike: 13, more: 21, muchMore: 24 } },
    oral: { maxScore: 35, cutoffs: { muchLess: 0, less: 2, justLike: 6, more: 16, muchMore: 20 } },
    behavioral: { maxScore: 30, cutoffs: { muchLess: 0, less: 4, justLike: 7, more: 15, muchMore: 18 } },
  },
};

// Quadrant abbreviation mapping
export const SP2_QUADRANT_MAP: Record<string, string> = {
  'S.K.': 'seeking',
  'SK': 'seeking',
  'A.V.': 'avoiding',
  'AV': 'avoiding',
  'S.N.': 'sensitivity',
  'SN': 'sensitivity',
  'R.G.': 'registration',
  'RG': 'registration',
  '': 'none',
};

export const SP2_DESCRIPTION_CATEGORIES = [
  'Much Less Than Others',
  'Less Than Others',
  'Just Like the Majority of Others',
  'More Than Others',
  'Much More Than Others',
] as const;

export function getSP2Description(rawScore: number, cutoffs: { muchLess: number; less: number; justLike: number; more: number; muchMore: number }): string {
  if (rawScore >= cutoffs.muchMore) return 'Much More Than Others';
  if (rawScore >= cutoffs.more) return 'More Than Others';
  if (rawScore >= cutoffs.justLike) return 'Just Like the Majority of Others';
  if (rawScore >= cutoffs.less) return 'Less Than Others';
  return 'Much Less Than Others';
}

