/**
 * Goal Bank Data
 * 
 * Pre-set goals organized by type (OT/Early Intervention, Feeding Therapy)
 * and sub-categories. Sourced from clinical goal bank documents.
 */

export interface GoalBankItem {
  id: string;
  text: string;
  textEs?: string; // Spanish translation (feeding goals only)
}

export interface GoalBankCategory {
  id: string;
  name: string;
  nameEs?: string; // Spanish translation (feeding categories only)
  goals: GoalBankItem[];
}

export interface GoalBankType {
  id: string;
  name: string;
  categories: GoalBankCategory[];
}

export const GOAL_BANK: GoalBankType[] = [
  {
    id: 'ot-ei',
    name: 'OT / Early Intervention',
    categories: [
      {
        id: 'ot-babies',
        name: 'Babies',
        goals: [
          { id: 'ot-babies-1', text: 'To demonstrate improved fine motor skills, client will demonstrate appropriate volitional release of a small item into a container during play, without physical cuing, in 3 out of 5 opportunities.' },
          { id: 'ot-babies-2', text: 'To demonstrate improved gross motor/motor planning skills, client will transition (supine to sit; sit to quad) demonstrating improved coordination of movements and core/trunk activation, in 3 out of 4 opportunities.' },
          { id: 'ot-babies-3', text: 'To demonstrate improved gross motor head/neck control, client will extend/maintain head/neck upright for 3-5min while supported sitting to engage in eating 4/5 opportunities.' },
          { id: 'ot-babies-4', text: 'To demonstrate improved gross motor/motor planning skills, client will be able to transition (ie: stand to squat to stand/sit to stand during play, without holding onto furniture for support, in 4 out of 5 opportunities.' },
          { id: 'ot-babies-5', text: 'Child will be able to initiate lateral weight shift to reach and grasp a toy in one, and maintain grasp for 5 seconds, in 3/4 trials.' },
          { id: 'ot-babies-6', text: 'To demonstrate improved gross motor/motor planning skills, client will transition (supine to sit) with mod assist, demonstrating improved coordination of movements and core/trunk activation, in 3 out of 4 opportunities.' },
          { id: 'ot-babies-7', text: 'To demonstrate improved vestibular discrimination skills, client will sit with mod assist, for at least 60 seconds while playing with a toy, demonstrating postural/protective reactions, 4 out of 5 opportunities.' },
          { id: 'ot-babies-8', text: 'To demonstrate improved bilateral integration skills, client will bang toys together at midline during play, 3 out of 5 opportunities.' },
        ],
      },
      {
        id: 'ot-behavior-sensory',
        name: 'Behavior / Sensory',
        goals: [
          { id: 'ot-bs-1', text: 'To demonstrate improved organization of behavior and sustained attention, client will attend to task for at least 2 minutes, with sensory supports provided as needed, in 4 out of 5 opportunities.' },
          { id: 'ot-bs-2', text: 'To demonstrate improved organization of behavior, client will transition from preferred activities and engage in non preferred activities without eloping, hitting, crying and using sensory cues as needed in 3/5 opportunities.' },
          { id: 'ot-bs-3', text: 'To demonstrate improved tactile modulation skills, client will engage in messy play, touching/bringing hands/feet into various media (i.e., paint, glue, playdoh, foam soap, foods, etc.) without demonstrating aversion, in 3 out of 5 opportunities.' },
          { id: 'ot-bs-4', text: 'In order to demonstrate improved sensory processing and proprioceptive discrimination, client will adequately grade his force during fine motor activities, with no more than 2 verbal cues, in 3 out of 4 opportunities.' },
        ],
      },
      {
        id: 'ot-fine-motor',
        name: 'Fine Motor',
        goals: [
          { id: 'ot-fm-1', text: 'To demonstrate improved fine motor skills, client will demonstrate appropriate volitional release of a small item into a container during play, without physical cuing, in 3 out of 5 opportunities.' },
          { id: 'ot-fm-2', text: 'To demonstrate improved fine motor skills, client will imitate vertical/horizontal strokes with quadrupod/emerging tripod grasp, with minimal cues, 4/5 opportunities.' },
          { id: 'ot-fm-3', text: 'To demonstrate improved fine motor skills, client will open twist cap containers to take out contents, with wrist rotation, minimal assistance, in 3 out of 4 opportunities.' },
          { id: 'ot-fm-4', text: 'To demonstrate improved bilateral integration skills, client will string several beads (medium/small) through a shoelace, with minimal assistance, in 3 out of 4 opportunities.' },
        ],
      },
      {
        id: 'ot-gross-motor',
        name: 'Gross Motor',
        goals: [
          { id: 'ot-gm-1', text: 'To demonstrate improved vestibular processing/motor planning skills, client will navigate through a simple 1-2 step obstacle course/play routine, with different balance components, with improved body/safety awareness, given minimal assistance, in 3 out of 5 opportunities.' },
          { id: 'ot-gm-2', text: 'To demonstrate improved balance reactions/coordination and spatial awareness, client will navigate a 2-3 step obstacle course, with min assist, in 3 out of 4 opportunities.' },
        ],
      },
      {
        id: 'ot-adaptive',
        name: 'Adaptive',
        goals: [
          { id: 'ot-ad-1', text: 'To demonstrate improved adaptive behavior/postural reactions, client will doff socks in seated position with minimal physical assistance, in 3 out of 4 opportunities presented.' },
          { id: 'ot-ad-2', text: 'To demonstrate improved adaptive skills, child will be able to doff 2 pcs of loose clothing (i.e., shirt, shorts) with 1 tactile prompt per item, in 3 out of 4 opportunities.' },
          { id: 'ot-ad-3', text: 'To demonstrate improved adaptive/motor planning skills, client will doff two pieces of loose clothing (shirt/jacket/pants), with no more than 2 verbal/tactile cues, in 3 out of 4 opportunities.' },
        ],
      },
      {
        id: 'ot-feeding',
        name: 'Feeding (OT)',
        goals: [
          { id: 'ot-fd-1', text: 'To demonstrate improved oral/motor feeding skills, client will be able to demonstrate improved tongue lateralization to move bolus for chewing in 3 out of 5 opportunities.' },
          { id: 'ot-fd-2', text: 'To demonstrate improved self-help/adaptive skills, child will be able to self-feed using a spoon, with less than 25% spillage, in 3 out of 5 opportunities.' },
          { id: 'ot-fd-3', text: 'Will participate in messy food play without aversive reaction in 3 out 5 opportunities.' },
          { id: 'ot-fd-4', text: 'Client will be able to bite and chew hard mechanicals 75% of the time within allowed time in 3 out of 5 opportunities; demonstrating improved chewing endurance and increase in jaw strength and stability.' },
          { id: 'ot-fd-5', text: 'To demonstrate improved oral motor skills, client will take consecutive sips of liquids via straw cup with lip rounding and minimal spillage with minimal assistance.' },
          { id: 'ot-fd-6', text: 'To demonstrate improved oral motor skills, client will take consecutive sips of liquids via an open cup with lip rounding and minimal spillage with minimal assistance.' },
          { id: 'ot-fd-7', text: 'To demonstrate improved oral motor control, client will demonstrate adequate lip closure by clearing contents of spoon without spillage, in 3/5 opportunities.' },
          { id: 'ot-fd-8', text: 'To demonstrate improved lip rounding, tongue retraction, jaw stability, and grading, client will drink consecutive swallows of liquids (water, blended fruit juices, smoothies, yogurt etc.), from a regular straw, with minimal chin support, without spillage/suckling/jaw sliding, in 3 out of 4 opportunities.' },
          { id: 'ot-fd-9', text: 'To demonstrate improved jaw strength/oral motor skills, client will manage mashed/soft cubes texture (mashed banana, scraped ripe avocado, smashed soups/pasta, etc.) with good tongue lateralization, without gagging, in 3 out of 5 opportunities.' },
        ],
      },
    ],
  },
  {
    id: 'feeding-therapy',
    name: 'Feeding Therapy',
    categories: [
      {
        id: 'ft-straw',
        name: 'Straw Drinking',
        nameEs: 'Beber con pajilla/popote',
        goals: [
          { id: 'ft-straw-1', text: 'Patient will demo and maintain lip closure on straw without tactile facilitation, 2 of 3 opportunities in order to draw liquid into the mouth.', textEs: 'El paciente demostrará y mantendrá cerrados sus labios en la pajilla/popote sin ayuda táctil para extraer líquido a la boca en 2 de 3 oportunidades.' },
          { id: 'ft-straw-2', text: 'Patient will demo ability to express liquid from straw 2 of 3 opportunities without facilitation.', textEs: 'El paciente demostrará la capacidad de succionar líquido de la pajilla/popote en 2 de 3 oportunidades sin ayuda.' },
          { id: 'ft-straw-3', text: 'Patient will demo ability to maintain oral management of liquid bolus without anterior spillage during a single sip in 2 of 3 trials.', textEs: 'El paciente demostrará la capacidad oral de manejar el bolo líquido sin derramar durante un solo sorbo en 2 de 3 oportunidades.' },
          { id: 'ft-straw-4', text: 'Patient will demo ability to maintain oral management of liquid bolus without anterior spillage during sequential sips for 2 of 3 swallows.', textEs: 'El paciente demostrará la capacidad oral de manejar el bolo líquido sin derramar durante sorbos secuenciales en 2 de 3 oportunidades.' },
          { id: 'ft-straw-5', text: 'Patient will demonstrate ability to achieve labial seal around straw during straw pipette trials without anterior spillage in 2 of 3 trials.', textEs: 'El paciente demostrará la capacidad de sellar el labio alrededor de la pajilla/popote durante pruebas del método de pipeta sin derramar en 2 de 3 oportunidades.' },
        ],
      },
      {
        id: 'ft-cup',
        name: 'Cup Drinking',
        nameEs: 'Beber de vaso abierto',
        goals: [
          { id: 'ft-cup-1', text: 'Patient will achieve labial seal around cup without tactile facilitation in 2 of 3 trials.', textEs: 'El paciente logrará sellar sus labios alrededor del vaso sin ayuda táctil en 2 de 3 oportunidades.' },
          { id: 'ft-cup-2', text: 'Patient will achieve adequate labial seal around cup in order to achieve intraoral liquid transfer without anterior spillage in 2 of 3 trials.', textEs: 'El paciente logrará un sellado labial adecuado alrededor del vaso para lograr la transferencia intraoral de líquido sin derramar en 2 de 3 oportunidades.' },
          { id: 'ft-cup-3', text: 'Patient will demonstrate ability to achieve intraoral liquid transfer during cup drinking without anterior spillage in 3 of 4 trials.', textEs: 'El paciente demostrará la capacidad de lograr la transferencia intraoral de líquidos durante el consumo de líquidos de un vaso abierto sin derramar en 3 de 4 oportunidades.' },
          { id: 'ft-cup-4', text: 'Patient will demonstrate appropriate graded jaw control to participate in cup drinking without biting on cup ridge in 3 of 4 trials.', textEs: 'El paciente demostrará un control gradual de la mandíbula adecuado para participar en el consumo de líquidos de un vaso abierto sin morder la cresta del vaso en 3 de 4 oportunidades.' },
          { id: 'ft-cup-5', text: 'Patient will hold their cup independently/with minimal/moderate assistance from caregiver and take a drink at least once per meal.', textEs: 'El paciente sostendrá su vaso de forma independiente/con asistencia mínima a moderada del cuidador y beberá un trago al menos una vez por comida.' },
        ],
      },
      {
        id: 'ft-gagging',
        name: 'Gagging',
        nameEs: 'Arcadas',
        goals: [
          { id: 'ft-gag-1', text: 'Patient will demonstrate ability to bring resistive foods to mouth without resulting in gag at least 2x during the duration of a meal.', textEs: 'El paciente demostrará la capacidad de llevar alimentos resistentes a la boca sin provocar un reflejo nauseoso/arcada al menos 2 veces durante la duración de una comida.' },
          { id: 'ft-gag-2', text: 'Patient will demonstrate ability to consume age-appropriate portion of finger foods in 30 minute session with gag response upon fewer than 5 trials.', textEs: 'El paciente demostrará la capacidad de consumir porciones de alimentos adecuadas según su edad con los dedos en una sesión de 30 minutos con menos de 5 arcadas.' },
          { id: 'ft-gag-3', text: 'Caregiver will verbally recall the difference between gagging and choking.', textEs: 'El cuidador recordará verbalmente la diferencia entre las arcadas y el ahogamiento.' },
          { id: 'ft-gag-4', text: 'Caregiver will demonstrate the ability to remain calm and coach the child safely through a gag without external cues.', textEs: 'El cuidador demostrará la capacidad de mantener la calma y la capacidad de guiar al/a niño(a) de manera segura durante una arcada sin que se le dé instrucciones.' },
          { id: 'ft-gag-5', text: 'Caregiver will verbally recall the steps needed to help the child in the event of a choking situation.', textEs: 'El cuidador recordará verbalmente los pasos necesarios para ayudar al/a niño(a) en caso de un ahogamiento.' },
        ],
      },
      {
        id: 'ft-food-to-mouth',
        name: 'Food to Mouth (Gross/Fine Motor)',
        nameEs: 'Llevar alimentos a la boca (habilidades motoras)',
        goals: [
          { id: 'ft-ftm-1', text: 'Patient will demonstrate the ability to accurately pick-up a large piece of food from tray during 2 of 3 opportunities with minimal verbal or tactile cues.', textEs: 'El paciente demostrará la capacidad de recoger o agarrar un pedazo grande de comida de la bandeja con precisión en 2 de 3 oportunidades con ayuda externa mínima, ya sea verbal o táctil.' },
          { id: 'ft-ftm-2', text: 'Patient will demonstrate accurate hand to mouth movement with food during 2 of 3 opportunities without facilitation.', textEs: 'El paciente demostrará movimientos precisos de la mano al llevarse alimentos a la boca en 2 de 3 oportunidades sin ayuda externa.' },
          { id: 'ft-ftm-3', text: 'Patient will demonstrate ability to pick-up food from the tray or table using the pincer grasp during 2 of 3 opportunities with minimal verbal or tactile cues.', textEs: 'El paciente demostrará la capacidad de recoger o agarrar alimentos de la bandeja o mesa usando el agarre de pinza en 2 de 3 oportunidades con ayuda externa mínima, ya sea verbal o táctil.' },
        ],
      },
      {
        id: 'ft-spoon-feeding',
        name: 'Responsive Spoon Feeding',
        nameEs: 'Alimentación receptiva con cuchara',
        goals: [
          { id: 'ft-sf-1', text: 'Caregiver will demonstrate the ability to read patient\'s feeding cues in order to appropriately provide spoon feeding trials without verbal cues.', textEs: 'El cuidador demostrará la capacidad de leer las señales de alimentación del paciente para proporcionar adecuadamente intentos de alimentación con cuchara sin necesidad de ayuda verbal.' },
          { id: 'ft-sf-2', text: 'Caregiver will demonstrate the ability to provide the patient with a pre-loaded spoon in order to encourage self-feeding at least 3x/session without verbal cues.', textEs: 'El cuidador demostrará la capacidad de proporcionar al paciente una cuchara precargada para fomentar la alimentación independiente al menos 3 veces por sesión, sin ayuda verbal.' },
          { id: 'ft-sf-3', text: 'Caregiver will verbally identify 3 cues indicating refusal/completion of meal, and 3 cues indicating willingness to continue with meal.', textEs: 'El cuidador identificará verbalmente 3 señales que indican el rechazo o la finalización de la comida, y 3 señales que indican la voluntad de continuar con la comida.' },
          { id: 'ft-sf-4', text: 'During spoon feeding, patient will demonstrate approach behaviors (leaning in, opening mouth) 75% of the time when arriving to mealtime hungry.', textEs: 'Durante la alimentación con cuchara, el paciente demostrará comportamientos de aproximación (inclinarse, abrir la boca) el 75% del tiempo cuando llega a la mesa con hambre.' },
        ],
      },
      {
        id: 'ft-highchair',
        name: 'High Chair Seating',
        nameEs: 'Sentado adecuado en la silla alta/trona',
        goals: [
          { id: 'ft-hc-1', text: 'Patient will demonstrate the ability to sit upright in a high chair with appropriate support to bring hands to mouth more than 2x during a 15-minute session.', textEs: 'El paciente demostrará la capacidad de sentarse erguido en una silla alta con el apoyo adecuado para llevar las manos a la boca más de 2 veces durante una sesión de 15 minutos.' },
          { id: 'ft-hc-2', text: 'Patient will tolerate the transition into a high chair during 2 of 3 meals without crying or yelling or showing other signs of distress.', textEs: 'El paciente tolerará que lo sienten en una silla alta durante 2 de 3 comidas sin llorar o gritar o mostrar otras señales de ansiedad o angustia.' },
          { id: 'ft-hc-3', text: 'Patient will remain seated in a high chair for a 5-minute period without signs of fatigue or distress.', textEs: 'El paciente permanecerá sentado en una silla alta durante un período de 5 minutos sin mostrar señales de fatiga o angustia.' },
          { id: 'ft-hc-4', text: 'Caregiver will demonstrate the ability to adjust the seating system, including the footplate to best support appropriate posture/alignment for feeding.', textEs: 'El cuidador demostrará la capacidad de ajustar el sistema de asientos, incluyendo la placa para los pies para apoyar así ayudar al/a niño(a) a mejorar su postura/tener una alineación adecuada para la alimentación.' },
          { id: 'ft-hc-5', text: 'Caregiver will demonstrate the ability to position baby in the high chair to facilitate 90-90-90 positioning with supports/modifications as needed to support safety and independence in feeding.', textEs: 'El cuidador demostrará la capacidad de colocar al bebé en la silla alta para facilitar el posicionamiento 90-90-90 con soportes o modificaciones según sea necesario para fomentar la alimentación independiente y la seguridad del/a niño(a).' },
          { id: 'ft-hc-6', text: 'Caregiver demonstrates the ability to use at least 1 adaptation from a provided list to support the infant\'s stability in a high chair.', textEs: 'El cuidador demostrará la capacidad de usar al menos 1 adaptación de una lista provista para ayudar a mejorar la estabilidad del bebé en una silla alta.' },
        ],
      },
      {
        id: 'ft-food-size',
        name: 'Safe Food Size/Shape',
        nameEs: 'Formas y tamaños seguros de los alimentos',
        goals: [
          { id: 'ft-fs-1', text: 'Caregiver will demonstrate how to appropriately cut 5 foods for baby based on age using resources available as reference as needed.', textEs: 'El cuidador demostrará cómo cortar 5 alimentos para el bebé de manera adecuada según la edad, utilizando los recursos disponibles como referencia según sea necesario.' },
          { id: 'ft-fs-2', text: 'Caregiver will demonstrate the ability to use online resources to identify how to prepare 5 foods for baby.', textEs: 'El cuidador demostrará la capacidad de usar recursos en línea para identificar cómo preparar 5 alimentos para el bebé.' },
          { id: 'ft-fs-3', text: 'Caregiver will demonstrate an understanding of the connection between how food is cut and baby\'s fine and gross motor skills needed for self-feeding.', textEs: 'El cuidador demostrará una comprensión adecuada de la conexión entre cómo se corta la comida y las habilidades motoras finas y gruesas necesarias del/a bebé para alimentarse independientemente.' },
        ],
      },
      {
        id: 'ft-chewing',
        name: 'Chewing',
        nameEs: 'Masticación',
        goals: [
          { id: 'ft-ch-1', text: 'Patient will demonstrate appropriate jaw grading to bite through or flatten trial foods in 2 of 3 trials given the verbal cues, "open" and "close".', textEs: 'El paciente demostrará la fuerza adecuada de la mandíbula para morder o aplanar los alimentos de prueba en 2 de 3 oportunidades dadas las señales verbales, "abrir" y "cerrar".' },
          { id: 'ft-ch-2', text: 'To support development of mastication, patient will demonstrate appropriate lingual lateralization when presented with resistive foods in 2 of 3 trials without need for cues.', textEs: 'Para apoyar el desarrollo de la masticación, el paciente demostrará una lateralización lingual adecuada cuando se le presente con alimentos resistivos en 2 de 3 oportunidades sin necesidad de señales o ayuda externa.' },
          { id: 'ft-ch-3', text: 'When presented with finger foods, patient will demonstrate the ability to achieve chewing or munching pattern vs. sucking pattern in 2 of 3 trials using visual cues as needed.', textEs: 'Cuando se le presente con alimentos en bocados, el paciente demostrará la capacidad de lograr el patrón de masticación vs. el patrón de succión en 2 de 3 oportunidades utilizando señales visuales según sea necesario.' },
          { id: 'ft-ch-4', text: 'When presented with finger foods, patient will demonstrate the ability to achieve chewing or munching pattern vs. lingual mashing in 2 of 3 trials, using visual cues as needed.', textEs: 'Cuando se le presente con alimentos en bocados, el paciente demostrará la capacidad de lograr un patrón de masticación vs. machacamiento lingual en 2 de 3 oportunidades, utilizando señales visuales según sea necesario.' },
          { id: 'ft-ch-5', text: 'Patient will demonstrate appropriate lingual lateralization in order to move bolus between lateral dentition to support rotary chew development in 2 of 3 trials without the need for verbal or tactile cues.', textEs: 'El paciente demostrará una lateralización lingual adecuada para poder mover el bolo entre la dentición lateral para así fomentar el desarrollo de la masticación rotativa en 2 de 3 oportunidades sin la necesidad de ayuda verbal o táctil.' },
        ],
      },
      {
        id: 'ft-stuffing',
        name: 'Stuffing / Food Pocketing',
        nameEs: 'La acumulación y el sobrellenado de comida',
        goals: [
          { id: 'ft-st-1', text: 'Patient will demonstrate the ability to spit out food when coached by clinician and/or caregiver using verbal and tactile cues in 2 of 3 trials.', textEs: 'El paciente demostrará la capacidad de escupir alimentos cuando el médico y/o cuidador se lo indique, utilizando señales verbales y táctiles en 2 de 3 oportunidades.' },
          { id: 'ft-st-2', text: 'To support development of mastication, patient will demonstrate appropriate lingual lateralization when presented with resistive foods in 2 of 3 trials without the need for verbal or visual cues.', textEs: 'Para fomentar el desarrollo de la masticación, el paciente demostrará una lateralización lingual adecuada cuando se le presenten alimentos resistivos en 2 de 3 oportunidades sin la necesidad de ayuda verbal o táctil.' },
          { id: 'ft-st-3', text: 'Patient will demonstrate the ability to bite down on food and tear away a smaller piece in 2 of 3 trials with verbal cues and modeling from caregiver or clinician.', textEs: 'El paciente demostrará la capacidad de morder la comida y desgarrar una pieza más pequeña en 2 de 3 oportunidades, con señales verbales y muestras del cuidador o médico.' },
        ],
      },
      {
        id: 'ft-utensils',
        name: 'Utensils',
        nameEs: 'Uso de utensilios',
        goals: [
          { id: 'ft-ut-1', text: 'Patient will demonstrate the ability to pick up a pre-loaded spoon from a tray or table, or grab the spoon when it is offered vertically in the air, and bring the utensil to mouth in 3 of 5 trials.', textEs: 'El paciente demostrará la capacidad de levantar una cuchara precargada de una bandeja o mesa, o agarrar la cuchara cuando se le ofrece verticalmente en el aire, y llevar el utensilio a la boca en 3 de 5 oportunidades.' },
          { id: 'ft-ut-2', text: 'Patient will bring the spoon back to bowl/plate/tray after bringing it to mouth in 3 of 5 trials.', textEs: 'El paciente demostrará que puede volver a llevar la cuchara al tazón/plato/bandeja después de llevarla a la boca en 3 de 5 oportunidades.' },
          { id: 'ft-ut-3', text: '(8-9mos+): Patient will demonstrate ability to take a pre-loaded fork with bite-sized piece of pre-loaded food to mouth and take food from the fork in 3 of 5 trials.', textEs: '(Para bebés de 8-9 meses o más): El paciente demostrará la capacidad de llevar un tenedor precargado con una pieza de comida del tamaño de un bocado precargada a la boca y comer alimentos del tenedor en 3 de 5 oportunidades.' },
        ],
      },
    ],
  },
];

// --- Custom Goal Bank (user-created goals that persist across all clients) ---
const CUSTOM_BANK_KEY = 'bayley4-custom-goal-bank';

export interface CustomGoalBankData {
  types: GoalBankType[];
}

export function loadCustomGoalBank(): GoalBankType[] {
  try {
    const data = JSON.parse(localStorage.getItem(CUSTOM_BANK_KEY) || '{"types":[]}') as CustomGoalBankData;
    return data.types;
  } catch { return []; }
}

function saveCustomGoalBank(types: GoalBankType[]) {
  localStorage.setItem(CUSTOM_BANK_KEY, JSON.stringify({ types }));
}

/** Get the full goal bank including custom goals merged in */
export function getFullGoalBank(): GoalBankType[] {
  const custom = loadCustomGoalBank();
  if (custom.length === 0) return GOAL_BANK;

  // Merge: built-in types first, then custom types
  // If a custom type has the same id as a built-in, merge their categories
  const merged: GoalBankType[] = GOAL_BANK.map(builtIn => {
    const customMatch = custom.find(c => c.id === builtIn.id);
    if (!customMatch) return builtIn;
    // Merge categories
    const mergedCategories = [...builtIn.categories];
    for (const customCat of customMatch.categories) {
      const existingCat = mergedCategories.find(c => c.id === customCat.id);
      if (existingCat) {
        // Add custom goals to existing category
        const existingIds = new Set(existingCat.goals.map(g => g.id));
        const newGoals = customCat.goals.filter(g => !existingIds.has(g.id));
        existingCat.goals = [...existingCat.goals, ...newGoals];
      } else {
        mergedCategories.push(customCat);
      }
    }
    return { ...builtIn, categories: mergedCategories };
  });

  // Add custom types that don't match any built-in
  for (const customType of custom) {
    if (!GOAL_BANK.find(b => b.id === customType.id)) {
      merged.push(customType);
    }
  }

  return merged;
}

/** Add a custom goal to the bank (persists in localStorage) */
export function addCustomGoalToBank(typeName: string, categoryName: string, goalText: string): GoalBankItem {
  const custom = loadCustomGoalBank();
  const typeId = `custom-${typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const categoryId = `custom-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const goalId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Find or create type
  let type = custom.find(t => t.id === typeId);
  if (!type) {
    type = { id: typeId, name: typeName, categories: [] };
    custom.push(type);
  }

  // Find or create category
  let category = type.categories.find(c => c.id === categoryId);
  if (!category) {
    category = { id: categoryId, name: categoryName, goals: [] };
    type.categories.push(category);
  }

  // Add goal
  const goal: GoalBankItem = { id: goalId, text: goalText };
  category.goals.push(goal);

  saveCustomGoalBank(custom);
  return goal;
}

/** Remove a custom goal from the bank */
export function removeCustomGoalFromBank(goalId: string): boolean {
  const custom = loadCustomGoalBank();
  let found = false;
  for (const type of custom) {
    for (const cat of type.categories) {
      const idx = cat.goals.findIndex(g => g.id === goalId);
      if (idx !== -1) {
        cat.goals.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  // Clean up empty categories and types
  for (let i = custom.length - 1; i >= 0; i--) {
    custom[i].categories = custom[i].categories.filter(c => c.goals.length > 0);
    if (custom[i].categories.length === 0) custom.splice(i, 1);
  }
  saveCustomGoalBank(custom);
  return found;
}

/** Add a custom goal to an existing built-in category */
export function addCustomGoalToExistingCategory(typeId: string, categoryId: string, goalText: string): GoalBankItem {
  const custom = loadCustomGoalBank();
  const goalId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Find the built-in type/category names
  const builtInType = GOAL_BANK.find(t => t.id === typeId);
  const builtInCat = builtInType?.categories.find(c => c.id === categoryId);

  const typeName = builtInType?.name || typeId;
  const categoryName = builtInCat?.name || categoryId;

  // Find or create matching custom type
  let type = custom.find(t => t.id === typeId);
  if (!type) {
    type = { id: typeId, name: typeName, categories: [] };
    custom.push(type);
  }

  // Find or create matching custom category
  let category = type.categories.find(c => c.id === categoryId);
  if (!category) {
    category = { id: categoryId, name: categoryName, goals: [] };
    type.categories.push(category);
  }

  const goal: GoalBankItem = { id: goalId, text: goalText };
  category.goals.push(goal);

  saveCustomGoalBank(custom);
  return goal;
}
