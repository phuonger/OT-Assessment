/**
 * Goal Bank Data
 * 
 * Pre-set goals organized by type (OT/Early Intervention, Feeding Therapy)
 * and sub-categories. Sourced from clinical goal bank documents.
 */

export interface GoalBankItem {
  id: string;
  text: string;
}

export interface GoalBankCategory {
  id: string;
  name: string;
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
        goals: [
          { id: 'ft-straw-1', text: 'Patient will demo and maintain lip closure on straw without tactile facilitation, 2 of 3 opportunities in order to draw liquid into the mouth.' },
          { id: 'ft-straw-2', text: 'Patient will demo ability to express liquid from straw 2 of 3 opportunities without facilitation.' },
          { id: 'ft-straw-3', text: 'Patient will demo ability to maintain oral management of liquid bolus without anterior spillage during a single sip in 2 of 3 trials.' },
          { id: 'ft-straw-4', text: 'Patient will demo ability to maintain oral management of liquid bolus without anterior spillage during sequential sips for 2 of 3 swallows.' },
          { id: 'ft-straw-5', text: 'Patient will demonstrate ability to achieve labial seal around straw during straw pipette trials without anterior spillage in 2 of 3 trials.' },
        ],
      },
      {
        id: 'ft-cup',
        name: 'Cup Drinking',
        goals: [
          { id: 'ft-cup-1', text: 'Patient will achieve labial seal around cup without tactile facilitation in 2 of 3 trials.' },
          { id: 'ft-cup-2', text: 'Patient will achieve adequate labial seal around cup in order to achieve intraoral liquid transfer without anterior spillage in 2 of 3 trials.' },
          { id: 'ft-cup-3', text: 'Patient will demonstrate ability to achieve intraoral liquid transfer during cup drinking without anterior spillage in 3 of 4 trials.' },
          { id: 'ft-cup-4', text: 'Patient will demonstrate appropriate graded jaw control to participate in cup drinking without biting on cup ridge in 3 of 4 trials.' },
          { id: 'ft-cup-5', text: 'Patient will hold their cup independently/with minimal/moderate assistance from caregiver and take a drink at least once per meal.' },
        ],
      },
      {
        id: 'ft-gagging',
        name: 'Gagging',
        goals: [
          { id: 'ft-gag-1', text: 'Patient will demonstrate ability to bring resistive foods to mouth without resulting in gag at least 2x during the duration of a meal.' },
          { id: 'ft-gag-2', text: 'Patient will demonstrate ability to consume age-appropriate portion of finger foods in 30 minute session with gag response upon fewer than 5 trials.' },
          { id: 'ft-gag-3', text: 'Caregiver will verbally recall the difference between gagging and choking.' },
          { id: 'ft-gag-4', text: 'Caregiver will demonstrate the ability to remain calm and coach the child safely through a gag without external cues.' },
          { id: 'ft-gag-5', text: 'Caregiver will verbally recall the steps needed to help the child in the event of a choking situation.' },
        ],
      },
      {
        id: 'ft-food-to-mouth',
        name: 'Food to Mouth (Gross/Fine Motor)',
        goals: [
          { id: 'ft-ftm-1', text: 'Patient will demonstrate the ability to accurately pick-up a large piece of food from tray during 2 of 3 opportunities with minimal verbal or tactile cues.' },
          { id: 'ft-ftm-2', text: 'Patient will demonstrate accurate hand to mouth movement with food during 2 of 3 opportunities without facilitation.' },
          { id: 'ft-ftm-3', text: 'Patient will demonstrate ability to pick-up food from the tray or table using the pincer grasp during 2 of 3 opportunities with minimal verbal or tactile cues.' },
        ],
      },
      {
        id: 'ft-spoon-feeding',
        name: 'Responsive Spoon Feeding',
        goals: [
          { id: 'ft-sf-1', text: 'Caregiver will demonstrate the ability to read patient\'s feeding cues in order to appropriately provide spoon feeding trials without verbal cues.' },
          { id: 'ft-sf-2', text: 'Caregiver will demonstrate the ability to provide the patient with a pre-loaded spoon in order to encourage self-feeding at least 3x/session without verbal cues.' },
          { id: 'ft-sf-3', text: 'Caregiver will verbally identify 3 cues indicating refusal/completion of meal, and 3 cues indicating willingness to continue with meal.' },
          { id: 'ft-sf-4', text: 'During spoon feeding, patient will demonstrate approach behaviors (leaning in, opening mouth) 75% of the time when arriving to mealtime hungry.' },
        ],
      },
      {
        id: 'ft-highchair',
        name: 'High Chair Seating',
        goals: [
          { id: 'ft-hc-1', text: 'Patient will demonstrate the ability to sit upright in a high chair with appropriate support to bring hands to mouth more than 2x during a 15-minute session.' },
          { id: 'ft-hc-2', text: 'Patient will tolerate the transition into a high chair during 2 of 3 meals without crying or yelling or showing other signs of distress.' },
          { id: 'ft-hc-3', text: 'Patient will remain seated in a high chair for a 5-minute period without signs of fatigue or distress.' },
          { id: 'ft-hc-4', text: 'Caregiver will demonstrate the ability to adjust the seating system, including the footplate to best support appropriate posture/alignment for feeding.' },
          { id: 'ft-hc-5', text: 'Caregiver will demonstrate the ability to position baby in the high chair to facilitate 90-90-90 positioning with supports/modifications as needed to support safety and independence in feeding.' },
          { id: 'ft-hc-6', text: 'Caregiver demonstrates the ability to use at least 1 adaptation from a provided list to support the infant\'s stability in a high chair.' },
        ],
      },
      {
        id: 'ft-food-size',
        name: 'Safe Food Size/Shape',
        goals: [
          { id: 'ft-fs-1', text: 'Caregiver will demonstrate how to appropriately cut 5 foods for baby based on age using resources available as reference as needed.' },
          { id: 'ft-fs-2', text: 'Caregiver will demonstrate the ability to use online resources to identify how to prepare 5 foods for baby.' },
          { id: 'ft-fs-3', text: 'Caregiver will demonstrate an understanding of the connection between how food is cut and baby\'s fine and gross motor skills needed for self-feeding.' },
        ],
      },
      {
        id: 'ft-chewing',
        name: 'Chewing',
        goals: [
          { id: 'ft-ch-1', text: 'Patient will demonstrate appropriate jaw grading to bite through or flatten trial foods in 2 of 3 trials given the verbal cues, "open" and "close".' },
          { id: 'ft-ch-2', text: 'To support development of mastication, patient will demonstrate appropriate lingual lateralization when presented with resistive foods in 2 of 3 trials without need for cues.' },
          { id: 'ft-ch-3', text: 'When presented with finger foods, patient will demonstrate the ability to achieve chewing or munching pattern vs. sucking pattern in 2 of 3 trials using visual cues as needed.' },
          { id: 'ft-ch-4', text: 'When presented with finger foods, patient will demonstrate the ability to achieve chewing or munching pattern vs. lingual mashing in 2 of 3 trials, using visual cues as needed.' },
          { id: 'ft-ch-5', text: 'Patient will demonstrate appropriate lingual lateralization in order to move bolus between lateral dentition to support rotary chew development in 2 of 3 trials without the need for verbal or tactile cues.' },
        ],
      },
      {
        id: 'ft-stuffing',
        name: 'Stuffing / Food Pocketing',
        goals: [
          { id: 'ft-st-1', text: 'Patient will demonstrate the ability to spit out food when coached by clinician and/or caregiver using verbal and tactile cues in 2 of 3 trials.' },
          { id: 'ft-st-2', text: 'To support development of mastication, patient will demonstrate appropriate lingual lateralization when presented with resistive foods in 2 of 3 trials without the need for verbal or visual cues.' },
          { id: 'ft-st-3', text: 'Patient will demonstrate the ability to bite down on food and tear away a smaller piece in 2 of 3 trials with verbal cues and modeling from caregiver or clinician.' },
        ],
      },
      {
        id: 'ft-utensils',
        name: 'Utensils',
        goals: [
          { id: 'ft-ut-1', text: 'Patient will demonstrate the ability to pick up a pre-loaded spoon from a tray or table, or grab the spoon when it is offered vertically in the air, and bring the utensil to mouth in 3 of 5 trials.' },
          { id: 'ft-ut-2', text: 'Patient will bring the spoon back to bowl/plate/tray after bringing it to mouth in 3 of 5 trials.' },
          { id: 'ft-ut-3', text: '(8-9mos+): Patient will demonstrate ability to take a pre-loaded fork with bite-sized piece of pre-loaded food to mouth and take food from the fork in 3 of 5 trials.' },
        ],
      },
    ],
  },
];
