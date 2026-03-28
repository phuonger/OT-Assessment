// Auto-generated from BAYLEY-4_TEMPLATEFile_Ver1.72.xlsx
// This file contains the exact assessment items from the Bayley-4 template

export interface ScoringCriteria {
  score: number;
  description: string;
}

export interface AssessmentItem {
  number: number;
  description: string;
  material?: string;
  startPoint: string;
  criteria: ScoringCriteria[];
  caregiverQuestion?: string;
  notes?: string[];
}

export interface StartPointRange {
  letter: string;
  ageRange: string;
  firstItem: number;
}

export interface DomainData {
  id: string;
  name: string;
  description: string;
  administration: string;
  reverseRule: string;
  discontinueRule: string;
  items: AssessmentItem[];
  startPoints: StartPointRange[];
}

// Start point letter to age range mapping
export const START_POINT_AGES: Record<string, string> = {
  "A": "0 months 16 days - 1 month 30 days",
  "B": "2 months 0 days - 2 months 30 days",
  "C": "3 months 0 days - 3 months 30 days",
  "D": "4 months 0 days - 4 months 30 days",
  "E": "5 months 0 days - 5 months 30 days",
  "F": "6 months 0 days - 6 months 30 days",
  "G": "7 months 0 days - 7 months 30 days",
  "H": "8 months 0 days - 10 months 30 days",
  "I": "11 months 0 days - 13 months 30 days",
  "J": "14 months 0 days - 16 months 30 days",
  "K": "17 months 0 days - 19 months 30 days",
  "L": "20 months 0 days - 22 months 30 days",
  "M": "23 months 0 days - 25 months 30 days",
  "N": "26 months 0 days - 28 months 30 days",
  "O": "29 months 0 days - 32 months 30 days",
  "P": "33 months 0 days - 38 months 30 days",
  "Q": "39 months 0 days - 42 months 30 days",
};

export const AGE_RANGES = [
  { label: "0 months 16 days - 1 month 30 days", startPoint: "A" },
  { label: "2 months 0 days - 2 months 30 days", startPoint: "B" },
  { label: "3 months 0 days - 3 months 30 days", startPoint: "C" },
  { label: "4 months 0 days - 4 months 30 days", startPoint: "D" },
  { label: "5 months 0 days - 5 months 30 days", startPoint: "E" },
  { label: "6 months 0 days - 6 months 30 days", startPoint: "F" },
  { label: "7 months 0 days - 7 months 30 days", startPoint: "G" },
  { label: "8 months 0 days - 10 months 30 days", startPoint: "H" },
  { label: "11 months 0 days - 13 months 30 days", startPoint: "I" },
  { label: "14 months 0 days - 16 months 30 days", startPoint: "J" },
  { label: "17 months 0 days - 19 months 30 days", startPoint: "K" },
  { label: "20 months 0 days - 22 months 30 days", startPoint: "L" },
  { label: "23 months 0 days - 25 months 30 days", startPoint: "M" },
  { label: "26 months 0 days - 28 months 30 days", startPoint: "N" },
  { label: "29 months 0 days - 32 months 30 days", startPoint: "O" },
  { label: "33 months 0 days - 38 months 30 days", startPoint: "P" },
  { label: "39 months 0 days - 42 months 30 days", startPoint: "Q" },
];

export const cognitiveData: DomainData = {
  id: "cognitive",
  name: "Cognitive",
  description: `Assesses visual preference, attention, memory, sensorimotor exploration, concept formation, problem solving, and counting abilities.`,
  administration: "Direct",
  reverseRule: "If the child obtains an imperfect score on any of the first 3 items, find the previous age start point and administer those items in a forward direction.",
  discontinueRule: "Discontinue when the child receives scores of 0 for 5 consecutive items.",
  startPoints: [
    { letter: "A", ageRange: "0 months 16 days - 1 month 30 days", firstItem: 1 },
    { letter: "B", ageRange: "2 months 0 days - 2 months 30 days", firstItem: 1 },
    { letter: "C", ageRange: "3 months 0 days - 3 months 30 days", firstItem: 1 },
    { letter: "D", ageRange: "4 months 0 days - 4 months 30 days", firstItem: 1 },
    { letter: "E", ageRange: "5 months 0 days - 5 months 30 days", firstItem: 6 },
    { letter: "F", ageRange: "6 months 0 days - 6 months 30 days", firstItem: 12 },
    { letter: "G", ageRange: "7 months 0 days - 7 months 30 days", firstItem: 12 },
    { letter: "H", ageRange: "8 months 0 days - 10 months 30 days", firstItem: 12 },
    { letter: "I", ageRange: "11 months 0 days - 13 months 30 days", firstItem: 19 },
    { letter: "J", ageRange: "14 months 0 days - 16 months 30 days", firstItem: 27 },
    { letter: "K", ageRange: "17 months 0 days - 19 months 30 days", firstItem: 27 },
    { letter: "L", ageRange: "20 months 0 days - 22 months 30 days", firstItem: 33 },
    { letter: "M", ageRange: "23 months 0 days - 25 months 30 days", firstItem: 33 },
    { letter: "N", ageRange: "26 months 0 days - 28 months 30 days", firstItem: 33 },
    { letter: "O", ageRange: "29 months 0 days - 32 months 30 days", firstItem: 45 },
    { letter: "P", ageRange: "33 months 0 days - 38 months 30 days", firstItem: 52 },
    { letter: "Q", ageRange: "39 months 0 days - 42 months 30 days", firstItem: 52 },
  ],
  items: [
    {
      number: 1,
      description: `Calms When Picked up`,
      material: `Timer`,
      startPoint: `A-D`,
      criteria: [
        { score: 2, description: `Consistently calms within 30 seconds when picked up and remains calms. | Almost everytime.` },
        { score: 1, description: `Inconsistently calms within 30 seconds or briefly calms when picked up but does not remain calm. | Some of the time.` },
        { score: 0, description: `Does not calm when picked up. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: If [Insert child's name] Is crying and you pick [him/her] up, does (he/she] calm down and stay calm almost every time [he/she) Is picked up, some of the time, or none of the time?`,
    },
    {
      number: 2,
      description: `Looks at Object`,
      material: `Ring with string, small ball, spoon, other small object of interest, timer`,
      startPoint: `A-D`,
      criteria: [
        { score: 2, description: `Looks continuously at object for 7 to 10 seconds.` },
        { score: 1, description: `Looks continuously at object for 3 to 6 seconds or looks intermittently at object during the 3 to 6 seconds.` },
        { score: 0, description: `Looks continuously at object for 0 to 2 seconds or does not look at object.` }
      ],
    },
    {
      number: 3,
      description: `Habituates to Rattle`,
      material: `Rattle`,
      startPoint: `A-D`,
      criteria: [
        { score: 2, description: `Habituates (i.e., displays a decrease in orienting response) within the first 3 trials on either side.` },
        { score: 1, description: `Habituates during the fourth or fifth trial on either side.` },
        { score: 0, description: `Does not display orienting response or does not habituate during the fifth trial on either side.` }
      ],
    },
    {
      number: 4,
      description: `Discriminates Between Objects`,
      material: `Bell, timer`,
      startPoint: `A-D`,
      criteria: [
        { score: 2, description: `Responds to bell by displaying a marked behavioral change that occurs within 5 seconds.` },
        { score: 1, description: `Responds to bell by displaying a marked behavioral change that is brief or does not occur within 5 seconds.` },
        { score: 0, description: `Displays no change.` }
      ],
    },
    {
      number: 5,
      description: `Recognizes Caregiver`,
      material: `None`,
      startPoint: `A-D`,
      criteria: [
        { score: 2, description: `Expression immediately changes to indicate caregiver recognition on at least 1 occasion.` },
        { score: 1, description: `Displays a short, brief change of expression or response is not immediate.` },
        { score: 0, description: `Displays no change of expression.` }
      ],
    },
    {
      number: 6,
      description: `Reaction to Caregiver`,
      material: `None`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Displays a reaction that is clearly anticipatory. | Almost every time.` },
        { score: 1, description: `Displays a reaction that is not clearly anticipatory. | Some of the time.` },
        { score: 0, description: `Displays no reaction. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When you are about to pick up [insert child's. name], does [he/she] clearly show that [he/she] is looking forward to being picked up almost every time, some of the time, or none of the time?`,
    },
    {
      number: 7,
      description: `Reacts to Departure of Caregiver`,
      material: `None`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Changes facial expression or displays other evidence of a reaction to the caregiver's departure (e.g., cessation of activity, frown, rudimentary searching).` },
        { score: 1, description: `Ambiguous or brief evidence of a reaction.` },
        { score: 0, description: `Displays no evidence of a reaction.` }
      ],
    },
    {
      number: 8,
      description: `Shifts Attention`,
      material: `Bell, rattle`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Eyes move from 1 object to the other for 3 trials.` },
        { score: 1, description: `Eyes move from 1 object to the other for 1 to 2 trials.` },
        { score: 0, description: `Does not look at striped pattern on either trial.` }
      ],
    },
    {
      number: 9,
      description: `Shows Visual Preference`,
      material: `Stimulus Book`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Looks longer at striped pattern on both trials.` },
        { score: 1, description: `Looks longer at striped pattern on only 1 trial.` },
        { score: 0, description: `Eyes do not move from 1 object to the other for any trial.` }
      ],
    },
    {
      number: 10,
      description: `Habituates to Ballons`,
      material: `Stimulus Book, timer`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Shows interest and habituates within 30 seconds.` },
        { score: 1, description: `Shows interest but does not habituate within 30 seconds.` },
        { score: 0, description: `Does not show interest or only gives fleeting glance.` }
      ],
    },
    {
      number: 11,
      description: `Prefers Ball`,
      material: `Stimulus Book, timer`,
      startPoint: `E`,
      criteria: [
        { score: 2, description: `Looks longer at ball than balloons for both trials.` },
        { score: 1, description: `Looks longer at ball than balloons for 1 trial.` },
        { score: 0, description: `Does not look longer at ball than balloons for either trial.` }
      ],
    },
    {
      number: 12,
      description: `Responds to Surroundings`,
      material: `None`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Quiets, looks around, and displays interest in surroundings.` },
        { score: 1, description: `Brief visual exploration of surroundings.` },
        { score: 0, description: `Shows no interest in surroundings.` }
      ],
    },
    {
      number: 13,
      description: `Explores Object`,
      material: `Rattle`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Attends to the sight, sound, or feel of rattle by touching shaking, or engaging in other playful activity.` },
        { score: 1, description: `Attends very briefly to rattle or simply mouths it.` },
        { score: 0, description: `Holds rattle but does not act upon it.` }
      ],
    },
    {
      number: 14,
      description: `Brings to Mouth`,
      material: `Ring with string, other object of interest Note. Ring with string items are also in the Fine Motor subtest.`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Consistently carries objects to mouth.` },
        { score: 1, description: `Inconsistently carries objects to mouth.` },
        { score: 0, description: `Does not try to bring objects to mouth.` }
      ],
    },
    {
      number: 15,
      description: `Inspects Own Hands`,
      material: `None`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Clear and sustained Inspection of hand(s). | Often` },
        { score: 1, description: `Ambiguous or brief inspection of hand(s). | Not often.` },
        { score: 0, description: `Does not inspect hand(s). | Not at all` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] is by [himself/herself], does [he/she] clearly look at [his/her] hands often, not often, or not at all?`,
    },
    {
      number: 16,
      description: `Interacts With Mirror Image`,
      material: `Mirror`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Interacts with mirror image by looking at it and smiling or laughing, making noises, reaching for it, patting It, or mouthing it.` },
        { score: 1, description: `Approaches mirror image with head, body, or hand and attends to mirror image for at least 5 seconds but does not interact with mirror image.` },
        { score: 0, description: `Attends to mirror image for less than 5 seconds or shows no response to mirror image.` }
      ],
    },
    {
      number: 17,
      description: `Reaches / Obtains Objects`,
      material: `Block, other small object of interest`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Persistently reaches for and obtains object.` },
        { score: 1, description: `Persistently reaches for or swipes at object but does not obtain It.` },
        { score: 0, description: `Does not reach for object or only initially reaches for object but is not persistent.` }
      ],
    },
    {
      number: 18,
      description: `Plays With Paper`,
      material: `Paper`,
      startPoint: `F-H`,
      criteria: [
        { score: 2, description: `Scratches, crinkles, or attempts to mouth paper and appears interested in the sound and/or texture.` },
        { score: 1, description: `Only reaches for paper and shows brief interest.` },
        { score: 0, description: `Looks at paper but does not attempt to touch it.` }
      ],
    },
    {
      number: 19,
      description: `Bangs Object`,
      material: `Block, spoon, other suitable hard object`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Intentional and frequent banging of object. | Often` },
        { score: 1, description: `Only occasional banging of object. | Not often.` },
        { score: 0, description: `Does not bang object. | Not at all` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] has something in [his/her] hand, does [he/she] purposely bang it on the furniture often, not often, or not at all?`,
    },
    {
      number: 20,
      description: `Pats Table`,
      material: `None`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Clearty imitates patting with 1 or both hands.` },
        { score: 1, description: `Pats 1 or both hands but may be spontaneous versus direct imitation.` },
        { score: 0, description: `Does not imitate patting.` }
      ],
    },
    {
      number: 21,
      description: `Searches for Object`,
      material: `Squeeze toy`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Searches for fallen toy by looking toward floor.` },
        { score: 1, description: `Shows indications of searching but does not look toward floor.` },
        { score: 0, description: `Does not show any Indication of searching.` }
      ],
    },
    {
      number: 22,
      description: `Obtains Ring`,
      material: `Ring with string Note. Ring with string items are also in the Fine Motor subtest`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Picks up string, purposely pulls it to secure ring, and then grasps ring.` },
        { score: 1, description: `Picks up string, purposely pulls it to secure ring, but does not grasp ring.` },
        { score: 0, description: `Does not show interest in securing ring or only plays with string.` }
      ],
    },
    {
      number: 23,
      description: `Picks Up and Holds Blocks`,
      material: `2 blocks`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Picks up 2 blocks and holds them simultaneously for at least 3 seconds.` },
        { score: 1, description: `Does not pick up 2 blocks but is able to hold them simultaneously for any 1 amount of time.` },
        { score: 0, description: `Holds blocks by resting them on the table or only obtains 1 block.` }
      ],
    },
    {
      number: 24,
      description: `Anticipatory Gaze`,
      material: `Object to hide entire head (e.g., clipboard)`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Shows anticipatory gaze for both trials.` },
        { score: 1, description: `Shows anticipatory gaze for either trial, even briefly.` },
        { score: 0, description: `Does not show anticipatory gaze for either trial.` }
      ],
    },
    {
      number: 25,
      description: `Rings Bell`,
      material: `Bell`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Holds bell by the handle and purposely rings bell.` },
        { score: 1, description: `Holds bell and explores it visually or with hands (e.g., manipulates clapper, 1 watches clapper).` },
        { score: 0, description: `Shows minimal interest in bell.` }
      ],
    },
    {
      number: 26,
      description: `Looks at Pictures`,
      material: `Storybook`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Regards at least 1 picture with interest or recognition even if interest is of short duration. | Almost every time` },
        { score: 1, description: `Displays fleeting interest in looking at pictures. | Some of the time` },
        { score: 0, description: `Touches or mouths book but shows no interest in specific pictures. | None of the time` }
      ],
      caregiverQuestion: `Caregiver Question: When you show [insert child's name] a book, does [he/she] look interested in the pictures almost every time, some of the time, or none of the time?`,
    },
    {
      number: 27,
      description: `Picks Up Another Block`,
      material: `3 blocks`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Holds 1 block while reaching for an additional block.` },
        { score: 1, description: `Releases 1 block to pick up an additional block.` },
        { score: 0, description: `Shows no Interest in additional block.` }
      ],
    },
    {
      number: 28,
      description: `Searches for Missing Objects`,
      material: `3 blocks, cup`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Actively searches for blocks in cup.` },
        { score: 1, description: `Glances in cup for blocks.` },
        { score: 0, description: `Shakes and plays with cup but does not search for blocks.` }
      ],
    },
    {
      number: 29,
      description: `Stirs Spoon`,
      material: `Spoon, cup`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Makes stirring motion and imitates readily.` },
        { score: 1, description: `Makes attempt to stir or hits cup with spoon.` },
        { score: 0, description: `Plays with spoon or cup individually but makes no attempt to imitate.` }
      ],
    },
    {
      number: 30,
      description: `Block Series: 3 Blocks`,
      material: `9 blocks, cup, timer`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Places 3 to 9 blocks in cup within 120 seconds.` },
        { score: 1, description: `Places 1 to 2 blocks in cup within 120 seconds.` },
        { score: 0, description: `Does not pick up any blocks or picks up a block but does not put it over or in cup within 120 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Blocks:`],
    },
    {
      number: 31,
      description: `Pushes Car`,
      material: `Car`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Intentionally pushes car so that all 4 of its wheels stay on table.` },
        { score: 1, description: `Makes car move but not in manner demonstrated (e.g., sideways, car tips over).` },
        { score: 0, description: `Shows no interest in pushing car or is only interested in details (e.g.,w heels).` }
      ],
    },
    {
      number: 32,
      description: `Finds Hidden Object`,
      material: `2 cups, 1 block`,
      startPoint: `J-K`,
      criteria: [
        { score: 2, description: `Finds block by looking first under correct cup on both sides in either trial.` },
        { score: 1, description: `Finds block by looking first under correct cup on only 1 side in either trial.` },
        { score: 0, description: `Does not attempt to find block or is unsuccessful in finding block.` }
      ],
    },
    {
      number: 33,
      description: `Suspends Ring`,
      material: `Ring with string Note. Ring with string items are also in the Fine Motor subtest.`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Obtains ring and suspends it by string without ring touching table.` },
        { score: 1, description: `Obtains ring and suspends it, but ring touches table.` },
        { score: 0, description: `Obtains ring but does not suspend it or only plays with ring or string.` }
      ],
    },
    {
      number: 34,
      description: `Removes Pellet`,
      material: `Food pellet, bottle`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Purposely removes pellet from bottle using some form of directed effort.` },
        { score: 1, description: `Shakes bottle and pellet comes out accidentally.` },
        { score: 0, description: `Shows no interest In pellet or shows Interest but does not remove pellet` }
      ],
    },
    {
      number: 35,
      description: `Clear Box`,
      material: `Clear box, small ball, timer`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Retrieves ball through open end of box within 1 to 20 seconds.` },
        { score: 1, description: `Retrieves ball through open end of box within 21 to 45 seconds.` },
        { score: 0, description: `Does not retrieve ball within 45 seconds.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 36,
      description: `Squeezes Object`,
      material: `Squeeze toy`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Intentionally squeezes toy, imitating examiner.` },
        { score: 1, description: `Attempts to make toy squeak by banging toy on a surface.` },
        { score: 0, description: `Does not attempt to make toy squeak.` }
      ],
    },
    {
      number: 37,
      description: `Finds Hidden Object (Reversed)`,
      material: `2 cups, 1 block`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Finds block by first looking under correct cup for 4 trials.` },
        { score: 1, description: `Finds block by first looking under correct cup for 2 to 3 trials.` },
        { score: 0, description: `Finds block by first looking under correct cup for 0 to 1 trials.` }
      ],
    },
    {
      number: 38,
      description: `Pegboard Series: 2 Pegs`,
      material: `Pegboard, 6 yellow pegs, timer`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Places at least 2 pegs in 2 different holes within 70 seconds.` },
        { score: 1, description: `Places only 1 peg in hole within 70 seconds or places same peg in 2 different holes within 70 seconds..` },
        { score: 0, description: `Does not place any pegs in a hole within 70 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pegs:`],
    },
    {
      number: 39,
      description: `Relational Play: Self`,
      material: `None`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Caregiver provides at least 3 examples.` },
        { score: 1, description: `Caregiver provides 1 to 2 examples.` },
        { score: 0, description: `Caregiver provides 0 examples.` }
      ],
      caregiverQuestion: `Caregiver Question: When playing, does [insert child's name] pretend to do things like drink from an empty cup? If the caregiver says no, score 0. If the caregiver says yes, ask, Can you give me some examples of other things [he/she] pretends to do?`,
    },
    {
      number: 40,
      description: `Pink Board Series: 2 Pieces`,
      material: `Pink board, red block set, timer`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Places 2 to 3 pieces that fit exactly within 60 seconds.` },
        { score: 1, description: `Places 1 piece that fits exactly within 90 seconds or places 2 pieces within 60 seconds but 1 piece does not fit exactly.` },
        { score: 0, description: `Does not place any pieces that fit exactly within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 41,
      description: `listens to Story`,
      material: `Storybook`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Attends to story the entire time with only brief lapses in attention. | Almost every time` },
        { score: 1, description: `Attends to story for only a short time, | Some of the time` },
        { score: 0, description: `Shows no interest in book or does not attend to story. | None of the time` }
      ],
      caregiverQuestion: `Caregiver Question: When you read to [insert child's name], does [he/she] pay attention to the entire story almost every time, some of the time, or none of the time?`,
    },
    {
      number: 42,
      description: `Finds Hidden Object (Visible Displacement)`,
      material: `2 cups, 1 block`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
    },
    {
      number: 43,
      description: `Blue Board Series: 1 Piece`,
      material: `Blue board, blue block set, timer`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Places 1 to 9 pieces that fit exactly within 90 seconds.` },
        { score: 1, description: `Places at least 1 piece within 90 seconds but piece does not fit exactly.` },
        { score: 0, description: `Does not place any pieces that fit exactly within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 44,
      description: `Relational Play: Others`,
      material: `Doll, cup, spoon, small ball, comb, tissue`,
      startPoint: `L-N`,
      criteria: [
        { score: 2, description: `Uses at least 2 objects with doll or caregiver.` },
        { score: 1, description: `Uses only 1 object with doll or caregiver.` },
        { score: 0, description: `Uses 0 objects with doll or caregiver.` }
      ],
    },
    {
      number: 45,
      description: `Block Series: 9 Blocks`,
      material: `9 blocks, cup, timer`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Places 9 blocks in cup within 120 seconds.` },
        { score: 1, description: `Places 5 to 8 blocks in cup within 120 seconds.` },
        { score: 0, description: `Does not place at least 5 blocks in cup within 120 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Blocks:`],
    },
    {
      number: 46,
      description: `Pegboard Series, 6 Pegs`,
      material: `Pegboard, 6 yellow, pegs, timer`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Places all 6 pegs within 1 to 35 seconds.` },
        { score: 1, description: `Places all 6 pegs within 36 to 90 seconds.` },
        { score: 0, description: `Does not place all 6 pegs within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pegs:`],
    },
    {
      number: 47,
      description: `Pink Board Series, 3 Pieces`,
      material: `Pink board, red block set, timer`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Places 3 pieces that fit exactly within 1 to 60 seconds.` },
        { score: 1, description: `Places 3 pieces that fit exactly within 61 to 90 seconds.` },
        { score: 0, description: `Does not place 3 pieces that fit exactly within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 48,
      description: `Uses Pencil to Obtain Object`,
      material: `Pencil, small duck`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Makes at least 1 sweeping motion with pencil and obtains duck.` },
        { score: 1, description: `Makes at least 1 sweeping motion with pencil but does not obtain duck.` },
        { score: 0, description: `Hits or pushes duck with pencil, using random swings of pencil, without intending to pull duck toward him or her.` }
      ],
    },
    {
      number: 49,
      description: `Blue Board Series: 4 Pieces`,
      material: `Blue board, blue block set, timer`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Places 4 to 9 pieces that fit exactly within 90 seconds.` },
        { score: 1, description: `Places 3 pieces that fit exactly within 90 seconds.` },
        { score: 0, description: `Does not place at least 3 pieces that fit exactly within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 50,
      description: `Representational Play`,
      material: `None`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Caregiver provides at least 2 examples.` },
        { score: 1, description: `Caregiver provides 1 example.` },
        { score: 0, description: `Caregiver provides 0 examples.` }
      ],
      caregiverQuestion: `Caregiver Question: When playing, does [insert child's name] make-believe an object is something else, like pretending a ball is a piece of fruit? If the caregiver says no, score 0. If the caregiver says yes, ask, Can you give me some examples of other ways that [he/she] make-believes an object is something else?`,
    },
    {
      number: 51,
      description: `Rotated Pink Board`,
      material: `Pink board, red block set, timer`,
      startPoint: `O`,
      criteria: [
        { score: 2, description: `Places 3 pieces that fit exactly within 60 seconds.` },
        { score: 1, description: `Places 2 pieces that fit exactly within 60 seconds.` },
        { score: 0, description: `Does not place at least 2 pieces that fit exactly within 60 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 52,
      description: `Object Assembly: Ball`,
      material: `Ball puzzle, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Assembles puzzle within 1 to 60 seconds.` },
        { score: 1, description: `Assembles puzzle within 61 to 90 seconds.` },
        { score: 0, description: `Does not assemble puzzle within 90 seconds.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 53,
      description: `Object Assembly: Ice Cream Cone`,
      material: `Ice cream cone puzzle, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Assembles puzzle within 1 to 60 seconds.` },
        { score: 1, description: `Assembles puzzle within 61 to 90 seconds.` },
        { score: 0, description: `Does not assemble puzzle within 90 seconds.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 54,
      description: `Matches Pictures`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 to 4 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 55,
      description: `Blue Board Series: 9 Pieces`,
      material: `Blue board, blue block set, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Places 9 pieces that fit exactly within 90 seconds.` },
        { score: 1, description: `Places 5 to 8 pieces that fit exactly within 90 seconds.` },
        { score: 0, description: `Does not place at least 5 pieces that fit exactly within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of Pieces:`],
    },
    {
      number: 56,
      description: `Spatial Memory: 3 Cards`,
      material: `Memory Cards (Set A), timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 57,
      description: `Imitates 2-Step Action`,
      material: `Small duck, spoon`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Imitates both steps correctly and in sequence making duck fly into air.` },
        { score: 1, description: `Imitates only 1 step (i.e., puts duck on spoon handle or hits bowl of spoon without duck on spoon handle).` },
        { score: 0, description: `Does not imitate either step.` }
      ],
    },
    {
      number: 58,
      description: `Matches 3 Colors`,
      material: `Stimulus Book, 1 bigred disk, 1 big yellow disk, 1 big blue disk, 1 big green disk`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 trials` },
        { score: 1, description: `Provides correct response for 2 trials.` },
        { score: 0, description: `Provides correct response for 0 to 1 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 59,
      description: `Imaginary Play`,
      material: `None`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Caregiver provides at least 2 examples.` },
        { score: 1, description: `Caregiver provides 1 example.` },
        { score: 0, description: `Caregiver provides 0 examples.` }
      ],
      caregiverQuestion: `Caregiver Question: When playing, does [insert child's name] use imaginary objects? If the caregiver says no, score 0. If the caregiver says yes, ask, Can you give me some examples of [him/her] using imaginary objects?`,
    },
    {
      number: 60,
      description: `Recalls Names`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 to 3 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 61,
      description: `Understands Concept of One`,
      material: `3 blocks, paper, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Places 1 block on paper within 1 to 5 seconds.` },
        { score: 1, description: `Places 1 block on paper within 6 to 20 seconds, or initially places 1 block but then adds more blocks.` },
        { score: 0, description: `Does not place any blocks on paper within 20 seconds or initially places all blocks on paper.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 62,
      description: `Grouping: Color`,
      material: `1 big blue disk, 1 little blue disk, 1 big yellow disk, 1 little yellow disk`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Identifies both blue disks and does not identify any yellow disks.` },
        { score: 1, description: `ldentifies only 1 blue disk and does not identify any yellow disks.` },
        { score: 0, description: `Identifies only yellow disks or identifies both blue and yellow disks.` }
      ],
    },
    {
      number: 63,
      description: `Grouping: Size`,
      material: `1 big red disk, 1 little red disk, 1 big yellow disk, 1 little yellow disk`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Identifies both little disks for Trial 1 and both big disks for Trial 2.` },
        { score: 1, description: `ldentifies both little disks for Trial 1 but not both big disks for Trial 2 or vice versa.` },
        { score: 0, description: `Does not identify both little disks for Trial 1 or both big disks for Trial 2.` }
      ],
    },
    {
      number: 64,
      description: `Repeats Words`,
      material: `None`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 to 4 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 65,
      description: `Compares Masses`,
      material: `1 big weighted duck, 1 big unweighted duck`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
    },
    {
      number: 66,
      description: `Matches Size`,
      material: `1 big red disk, 1 big blue disk, 1 little yellow disk`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
    },
    {
      number: 67,
      description: `Discriminates Pictures`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 trials.` },
        { score: 1, description: `Provides correct for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 68,
      description: `Simple Pattern`,
      material: `2 big blue disks, 1 big red disk, 1 big yellow disk, 1 little yellow disk, 1 little red disk`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
    },
    {
      number: 69,
      description: `Sorts Pegs by Color`,
      material: `4 red pegs, 4 yellow pegs, 4 blue pegs, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Sorts all pegs by color into separate piles with no errors within 60 seconds.` },
        { score: 1, description: `Sorts all pegs by color into separate piles with 1 to 2 errors within 60 seconds.` },
        { score: 0, description: `Sorts all pegs by color into separate piles with more than 2 errors within 60 seconds or does not sort pegs.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 70,
      description: `Counts (One-to-One Correspondence)`,
      material: `5 blocks`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Counts 3 to 5 blocks in proper sequence (without skipping any block) and assigns only 1 number to each block when counting.` },
        { score: 1, description: `Counts 2 blocks in proper sequence and assigns only 1 number to each block when counting.` },
        { score: 0, description: `Does not count 2 blocks in proper sequence or assigs more than 1 number to any block.` }
      ],
      notes: [`Comments`],
    },
    {
      number: 71,
      description: `Discriminates Sizes`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 72,
      description: `Identifies 3 Incomplete Pictures`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Identifies picture after first or second page for 3 pictures.` },
        { score: 1, description: `Identifies picture after first or second page for 2 pictures.` },
        { score: 0, description: `Identifies picture after first or second page for 0 to 1 pictures.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 73,
      description: `Object Assembly: Dog`,
      material: `Dog puzzle, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Assembles puzzle within 1 to 60 seconds.` },
        { score: 1, description: `Assembles puzzle within 61 to 90 seconds.` },
        { score: 0, description: `Does not assemble puzzle within 90 seconds.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 74,
      description: `Object Assembly: Cat`,
      material: `Cat puzzle, timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Assembles puzzle within 1 to 60 seconds.` },
        { score: 1, description: `Assembles puzzle within 61 to 90 seconds.` },
        { score: 0, description: `Does not assemble puzzle within 90 seconds.` }
      ],
      notes: [`Completion Time:`],
    },
    {
      number: 75,
      description: `Discriminates Patterns`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 76,
      description: `Spatial Memory: 6 Cards`,
      material: `Memory Cards (Set B), timer`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 2 to 3 trials.` },
        { score: 1, description: `Provides correct response for 1 trial.` },
        { score: 0, description: `Provides correct response for 0 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 77,
      description: `Counts (Cardinality)`,
      material: `10 blocks`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Counts all 10 blocks accurately and says there are 10 blocks.` },
        { score: 1, description: `Counts 5 to 9 blocks or counts all 10 blocks but does not say there are 10 blocks.` },
        { score: 0, description: `Does not count at least 5 blocks.` }
      ],
    },
    {
      number: 78,
      description: `Number Constancy`,
      material: `5 blocks`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Counts 5 blocks and says there are 5 blocks.` },
        { score: 1, description: `Counts 5 blocks but does not say there are 5 blocks, or does not count 5 blocks but says there are 5 blocks.` },
        { score: 0, description: `Does not count 5 blocks and does not say there are 5 blocks.` }
      ],
    },
    {
      number: 79,
      description: `Classifies Objects`,
      material: `Stimulus Book`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 3 trials.` },
        { score: 1, description: `Provides correct response for 1 to 2 trials.` },
        { score: 0, description: `Provides correct response for 0 trials..` }
      ],
      notes: [`Correct?`, `Comments`],
    },
    {
      number: 80,
      description: `Repeats Number Sequences`,
      material: `None`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 4 to 6 trials.` },
        { score: 1, description: `Provides correct response for 3 trials.` },
        { score: 0, description: `Provides correct response for 0 to 2 trials.` }
      ],
      notes: [`Correct?`],
    },
    {
      number: 81,
      description: `Completes Patterns`,
      material: `Pegboard, 8 yellow pegs, 4 red pegs, 4 blue pegs`,
      startPoint: `P-Q`,
      criteria: [
        { score: 2, description: `Provides correct response for 4 to 6 trials.` },
        { score: 1, description: `Provides correct response for 3 trials.` },
        { score: 0, description: `Provides correct response for 0 to 2 trials.` }
      ],
      notes: [`Correct?`],
    },
  ],
};

export const fineMotorData: DomainData = {
  id: "fineMotor",
  name: "Fine Motor",
  description: `Measures fine motor skills including grasping, perceptual-motor integration, and hand-eye coordination.`,
  administration: "Direct",
  reverseRule: "If the child obtains an imperfect score on any of the first 3 items, find the previous age start point and administer those items in a forward direction.",
  discontinueRule: "Discontinue when the child receives scores of 0 for 5 consecutive items.",
  startPoints: [
    { letter: "A", ageRange: "0 months 16 days - 1 month 30 days", firstItem: 1 },
    { letter: "B", ageRange: "2 months 0 days - 2 months 30 days", firstItem: 1 },
    { letter: "C", ageRange: "3 months 0 days - 3 months 30 days", firstItem: 1 },
    { letter: "D", ageRange: "4 months 0 days - 4 months 30 days", firstItem: 1 },
    { letter: "E", ageRange: "5 months 0 days - 5 months 30 days", firstItem: 1 },
    { letter: "F", ageRange: "6 months 0 days - 6 months 30 days", firstItem: 9 },
    { letter: "G", ageRange: "7 months 0 days - 7 months 30 days", firstItem: 9 },
    { letter: "H", ageRange: "8 months 0 days - 10 months 30 days", firstItem: 9 },
    { letter: "I", ageRange: "11 months 0 days - 13 months 30 days", firstItem: 9 },
    { letter: "J", ageRange: "14 months 0 days - 16 months 30 days", firstItem: 13 },
    { letter: "K", ageRange: "17 months 0 days - 19 months 30 days", firstItem: 13 },
    { letter: "L", ageRange: "20 months 0 days - 22 months 30 days", firstItem: 13 },
    { letter: "M", ageRange: "23 months 0 days - 25 months 30 days", firstItem: 18 },
    { letter: "N", ageRange: "26 months 0 days - 28 months 30 days", firstItem: 18 },
    { letter: "O", ageRange: "29 months 0 days - 32 months 30 days", firstItem: 22 },
    { letter: "P", ageRange: "33 months 0 days - 38 months 30 days", firstItem: 22 },
    { letter: "Q", ageRange: "39 months 0 days - 42 months 30 days", firstItem: 22 },
  ],
  items: [
    {
      number: 1,
      description: `Eyes Follow Moving Person`,
      material: `None`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Eyes track person through midline to the left and to the right.` },
        { score: 1, description: `Eyes track person briefly but eyes do not follow past midline.` },
        { score: 0, description: `Eyes do not track person or child looks at something else in room.` }
      ],
    },
    {
      number: 2,
      description: `Follows Ring: Horizontal`,
      material: `Ring with string Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Eyes track ring through 1 complete trial.` },
        { score: 1, description: `Eyes track ring but not for a complete trial.` },
        { score: 0, description: `Eyes do not track ring.` }
      ],
    },
    {
      number: 3,
      description: `Follows Ring: Vertical`,
      material: `Ring with string Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Eyes track ring through 1 complete trial.` },
        { score: 1, description: `Eyes track ring but not for a complete trial.` },
        { score: 0, description: `Eyes do not track ring.` }
      ],
    },
    {
      number: 4,
      description: `Brings Hand to Mouth`,
      material: `None`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Attempts to place hand in mouth and has consistent success. | Almost every time` },
        { score: 1, description: `Attempts to place hand in mouth but does not have consistent success. | Some of the time` },
        { score: 0, description: `Does not attempt to place hand in mouth. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Can [insert child's name] successfully put [his/her] hand(s) in [his/her] mouth almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 5,
      description: `Retains Ring`,
      material: `Ring with string, timer Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Retains ring for at least 5 seconds. | Almost every time` },
        { score: 1, description: `Retains ring for 2 to 4 seconds | Some of the time` },
        { score: 0, description: `Retains ring for 0 to 1 seconds | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] has something in [his/her] hand, is [he/she) able to hold onto it for at least 5 seconds almost every time, some of the time, or none of the time?`,
    },
    {
      number: 6,
      description: `Head Follows Ring`,
      material: `Ring with string Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Head tracks ring through 1 complete trial.` },
        { score: 1, description: `Head tracks ring but not for a complete trial.` },
        { score: 0, description: `Head does not track ring.` }
      ],
    },
    {
      number: 7,
      description: `Follows Pencil: Horizontal`,
      material: `Pencil`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Eyes track pencil through 1 complete trial.` },
        { score: 1, description: `Eyes track pencil but not for a complete trial.` },
        { score: 0, description: `Eyes do not track pencil.` }
      ],
    },
    {
      number: 8,
      description: `Keeps Hands Open`,
      material: `None`,
      startPoint: `A-E`,
      criteria: [
        { score: 2, description: `Holds both hands open almost all of the time. | Almost all of the time.` },
        { score: 1, description: `Holds both hands open some of the time. | Some of the time.` },
        { score: 0, description: `One or both hands remain fisted most of the time or cortical thumbing is noted at least some of the time. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] is not holding something, are [his/her] hands open almost all the time, some of the time, or none of the time?`,
    },
    {
      number: 9,
      description: `Palmar Grasp Reflex`,
      material: `None`,
      startPoint: `F-I`,
      criteria: [
        { score: 2, description: `Hands do not reflexively close when palms are gently pressed.` },
        { score: 1, description: `Hands close briefly but then open and grasp is loose.` },
        { score: 0, description: `Hands reflexively close when palms are gently pressed and grasp is tight for several seconds.` }
      ],
    },
    {
      number: 10,
      description: `Distal Rotation`,
      material: `Block, rattle, bell, or other small object`,
      startPoint: `F-I`,
      criteria: [
        { score: 2, description: `Freely rotates wrist from palm down to palm up.` },
        { score: 1, description: `Slightly rotates wrist.` },
        { score: 0, description: `Does not rotate wrist.` }
      ],
    },
    {
      number: 11,
      description: `Grasps Suspended Ring`,
      material: `Ring with string Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `F-I`,
      criteria: [
        { score: 2, description: `Uses 1 or both hands to successfully grasp ring. | Almost every time.` },
        { score: 1, description: `Attempts to grasp ring with 1 or both hands but only makes contact. | Some of the time.` },
        { score: 0, description: `Does not reach for ring or attempts to touch ring are unsuccessful. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Is [insert child's name] able to successfully grab things that hang, like this ring (point to ring), almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 12,
      description: `Reaches for/Touches Block`,
      material: `Block`,
      startPoint: `F-I`,
      criteria: [
        { score: 2, description: `Extends 1 or both arms and touches block. | Almost every time.` },
        { score: 1, description: `Extends 1 or both arms but does not touch block. | Some of the time` },
        { score: 0, description: `Does not reach for block. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When things like this block (point to block) are placed in front of [insert child's name], is [he/she] able to reach for and touch them almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 13,
      description: `Block Grasp Series: Whole Hand`,
      material: `Block`,
      startPoint: `J-L`,
      criteria: [
        { score: 2, description: `Grasps block using 1 hand with whole hand (palmar) grasp or uses more advanced grasp.` },
        { score: 1, description: `Grasps block using both hands.` },
        { score: 0, description: `Does not grasp block.` }
      ],
    },
    {
      number: 14,
      description: `Looks at Pellet`,
      material: `Food Pellet`,
      startPoint: `J-L`,
      criteria: [
        { score: 2, description: `Looks at pellet for at least 3 seconds.` },
        { score: 1, description: `Looks at pellet for less than 3 seconds and does not focus on it.` },
        { score: 0, description: `Does not regard pellet.` }
      ],
    },
    {
      number: 15,
      description: `Pellet Grasp Series: Whole Hand`,
      material: `Food Pellet`,
      startPoint: `J-L`,
      criteria: [
        { score: 2, description: `Grasps pellet using whole hand grasp or uses more advanced grasp.` },
        { score: 1, description: `Inconsistently uses whole hand grasp or uses raking grasp.` },
        { score: 0, description: `Does not attempt to grasp pellet.` }
      ],
    },
    {
      number: 16,
      description: `Transfers Block or Ring`,
      material: `Block, ring with(out) string Note. Ring with string items are also in the Cognitive subtest`,
      startPoint: `J-L`,
      criteria: [
        { score: 2, description: `Transfers block (not ring) from hand to hand.` },
        { score: 1, description: `Transfers ring (not block) from hand to hand.` },
        { score: 0, description: `Does not transfer ring or block from hand to hand.` }
      ],
    },
    {
      number: 17,
      description: `Feeds Self`,
      material: `None`,
      startPoint: `J-L`,
      criteria: [
        { score: 2, description: `Almost every time.` },
        { score: 1, description: `Some of the time.` },
        { score: 0, description: `None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When you give [insert child's name] small foods, like peas, puffs, or raisins, is [he/she] able to successfully pick them up with [his/her] thumb and finger and put them in [his/her] mouth almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 18,
      description: `Block Grasp Series: Thumb Fingertip`,
      material: `Block`,
      startPoint: `M-N`,
      criteria: [
        { score: 2, description: `Grasps block using thumb-fingertip grasp.` },
        { score: 1, description: `Grasps block using partial thumb opposition grasp.` },
        { score: 0, description: `Uses less advanced grasp.` }
      ],
    },
    {
      number: 19,
      description: `Pellet Grasp Series: Neat Pincer`,
      material: `Food pellet`,
      startPoint: `M-N`,
      criteria: [
        { score: 2, description: `Grasps pellet using neat pincer grasp.` },
        { score: 1, description: `Grasps pellet using partial thumb opposition grasp.` },
        { score: 0, description: `Uses less advanced grasp.` }
      ],
    },
    {
      number: 20,
      description: `Tums Pages of Book`,
      material: `Storybook`,
      startPoint: `M-N`,
      criteria: [
        { score: 2, description: `Consistently and successfully attempts to turn 1 page at a time. | Almost every time.` },
        { score: 1, description: `Occasionally turns 1 page at a time but typically turns several pages. | Some of the time` },
        { score: 0, description: `Does not attempt to turn pages. | None of the time.` }
      ],
    },
    {
      number: 21,
      description: `Pencil Grasp Series: Palmar`,
      material: `Crayon or pencil, paper`,
      startPoint: `M-N`,
      criteria: [
        { score: 2, description: `Grasps crayon or pencil using palmar grasp (palmar supinate or radial cross palmar) and makes a mark on paper or uses more advanced grasp.` },
        { score: 1, description: `Grasps crayon or pencil using fingers and thumb opposition but does not make a mark.` },
        { score: 0, description: `Does not grasp crayon or pencil firmly in palm.` }
      ],
    },
    {
      number: 22,
      description: `Finger in Pegboard`,
      material: `Pegboard`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Intentionally pokes a finger or thumb in at least 2 holes.` },
        { score: 1, description: `Intentionally pokes a finger or thumb in 1 hole or pokes a finger or thumb repeatedly in the same hole.` },
        { score: 0, description: `Shows no interest in pegboard or does not poke a finger into any holes.` }
      ],
    },
    {
      number: 23,
      description: `Scribbles Spontaneously`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Spontaneously and purposely scribbles on paper.` },
        { score: 1, description: `Purposely scribbles on paper after demonstration.` },
        { score: 0, description: `Accidentally marks on paper while playing with crayon or does not mark on paper.` }
      ],
    },
    {
      number: 24,
      description: `Block Stacking Series: 2 Blocks`,
      material: `12 blocks`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Stacks 2 to 12 blocks in any trial..` },
        { score: 1, description: `Stacks 2 blocks but does not leave them stacked, does not release second block, or blocks fall over.` },
        { score: 0, description: `Base is not a single block or does not stack blocks.` }
      ],
      notes: [`Number of blocks:`],
    },
    {
      number: 25,
      description: `Pellets in Bottle`,
      material: `10 food pellets, bottle, timer`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Places 10 pellets in bottle within 60 seconds, 1 at a time..` },
        { score: 1, description: `Places 5 to 9 pellets in bottle within 60 seconds, 1 at a time.` },
        { score: 0, description: `Places 0 to 4 pellets in bottle within 60 seconds, 1 at a time.` }
      ],
      notes: [`Completion Time:`, `Number of Pellets`],
    },
    {
      number: 26,
      description: `Pencil Grasp Series: Transitional`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Consistently grasps crayon or pencil using transitional grasp (digital pronate) and makes a mark on paper or uses more advanced grasp.` },
        { score: 1, description: `Inconsistently uses transitional grasp and marks on paper.` },
        { score: 0, description: `Uses less advanced grasp.` }
      ],
    },
    {
      number: 27,
      description: `Coins in Bank`,
      material: `Bank, 7 coins, timer`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Places 4 to 7 coins In slot within 90 seconds.` },
        { score: 1, description: `Places 3 coins In slot within 90 seconds.` },
        { score: 0, description: `Places 0 to 2 coins in slot within 90 secon.` }
      ],
      notes: [`Completion Time:`, `Number of coins:`],
    },
    {
      number: 28,
      description: `Takes Blocks Apart`,
      material: `Connecting block set`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Separates all stacked blocks.` },
        { score: 1, description: `Separates at least 1 block from stacked blocks.` },
        { score: 0, description: `Does not separate any stacked blocks.` }
      ],
    },
    {
      number: 29,
      description: `Pencil Grasp Series: Static Tripod`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Consistently grasps crayon or pencil using static tripod grasp or static quadrupod grasp and makes a mark on paper or uses more advanced grasp.` },
        { score: 1, description: `Inconsistently uses static tripod grasp or static quadrupod and marks on paper.` },
        { score: 0, description: `Uses less advanced grasp.` }
      ],
    },
    {
      number: 30,
      description: `Block Stacking Series: 6 Blocks`,
      material: `12 blocks`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Stacks 6 to 12 blocks in any trial.` },
        { score: 1, description: `Stacks 4 to 5 blocks in any trial.` },
        { score: 0, description: `Does not stack at least 4 blocks in any trial or uses 2 or more blocks as the base.` }
      ],
      notes: [`Number of blocks:`],
    },
    {
      number: 31,
      description: `Imitates Strokes: Horizontal and Vertical`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes both horizontal and vertical strokes that are within approximately 30° of your lines.` },
        { score: 1, description: `Makes either a horizontal or vertical stroke that is within approximately 30° of your lines.` },
        { score: 0, description: `Does not make horizontal or vertical strokes or neither stroke is within 30° of your lines.` }
      ],
    },
    {
      number: 32,
      description: `Connects Blocks`,
      material: `Connecting block set, timer`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Puts all 6 blocks together within 90 seconds.` },
        { score: 1, description: `Puts 3 to 5 blocks together within 90 seconds.` },
        { score: 0, description: `Puts 0 to 2 blocks together within 90 seconds.` }
      ],
      notes: [`Completion Time:`, `Number of blocks:`],
    },
    {
      number: 33,
      description: `Block Stacking Series: 8 Blocks`,
      material: `12 blocks`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Stacks 8 to 12 blocks in any trial.` },
        { score: 1, description: `Stacks 7 blocks In any trial.` },
        { score: 0, description: `Does not stack at least 7 blocks in any trial or uses 2 or more blocks as the base.` }
      ],
      notes: [`Number of blocks:`],
    },
    {
      number: 34,
      description: `Imitates Strokes: Circular`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes a mostly circular shape with no gap greater than 1 in.` },
        { score: 1, description: `Makes a mostly circular shape with a gap greater than 1 in.` },
        { score: 0, description: `Does not make a mostly circular shape.` }
      ],
    },
    {
      number: 35,
      description: `Builds Train`,
      material: `10 blocks`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Places 4 adjacent, touching blocks in a row and a fifth on top.` },
        { score: 1, description: `Places at least 4 adjacent, touching blocks in a row but fifth block is not placed on top.` },
        { score: 0, description: `Does not place 4 adjacent blocks in a row or adjacent blocks have a gap greater than ¼ in.` }
      ],
    },
    {
      number: 36,
      description: `Strings Blocks`,
      material: `Shoelace, 3 blocks with holes`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Strings 3 blocks on shoelace.` },
        { score: 1, description: `Strings 1 to 2 blocks on shoelace.` },
        { score: 0, description: `Strings 0 blocks on shoelace or threads blocks on tip of shoelace.` }
      ],
    },
    {
      number: 37,
      description: `Folds Paper`,
      material: `4 sheets of paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Folds paper approximately in half.` },
        { score: 1, description: `Folds paper but fold divides paper by less than half (e.g., into thirds).` },
        { score: 0, description: `Does not attempt to fold paper or crumples paper.` }
      ],
    },
    {
      number: 38,
      description: `Builds Bridge`,
      material: `6 blocks`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Replicates bridge.` },
        { score: 1, description: `Replicates bridge but has no gap between bottom blocks.` },
        { score: 0, description: `Does not replicate bridge.` }
      ],
    },
    {
      number: 39,
      description: `Imitates Plus Sign`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes 2 intersecting lines close to midpoint and both are within approximately 30° of your lines.` },
        { score: 1, description: `Makes 2 intersecting lines that do not intersect close to midpoint or lines have a break.` },
        { score: 0, description: `Does not make 2 intersecting lines or design does not resemble a plus sign.` }
      ],
    },
    {
      number: 40,
      description: `Managing Buttons`,
      material: `Button sleeve`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Both buttons and unbuttons sleeve.` },
        { score: 1, description: `Either buttons or unbuttons sleeve.` },
        { score: 0, description: `Does not button or unbutton sleeve.` }
      ],
    },
    {
      number: 41,
      description: `Traces Designs`,
      material: `Response Booklet, crayon or pencil`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Traces designs correctly for 3 trials.` },
        { score: 1, description: `Traces designs correctly for 1 to 2 trials.` },
        { score: 0, description: `Traces designs correctly for 0 trials.` }
      ],
    },
    {
      number: 42,
      description: `Imitates Square`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes a four-sided figure with 4 distinct corners and no gap larger than ¼ in at corners.` },
        { score: 1, description: `Makes a four-sided figure but corners are rounded or figure is clearly rectangular.` },
        { score: 0, description: `Does not make a four-sided figure.` }
      ],
    },
    {
      number: 43,
      description: `Copies Plus Sign`,
      material: `Response Booklet, crayon or pencil`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes 2 intersecting lines close to midpoint and both are within approximately 30° of the horizontal and vertical axes.` },
        { score: 1, description: `Makes 2 intersecting lines that do not intersect close to midpoint or lines have a break.` },
        { score: 0, description: `Does not make 2 intersecting lines or design does not resemble a plus sign.` }
      ],
    },
    {
      number: 44,
      description: `Taps Finger`,
      material: `Timer`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Taps at least 20 times within 15 seconds for both trials.` },
        { score: 1, description: `Taps at least 10 times within 15 seconds for at least 1 trial.` },
        { score: 0, description: `Does not tap at least 10 times within 15 seconds for at least 1 trial or taps other fingers along with index finger.` }
      ],
    },
    {
      number: 45,
      description: `Pencil Grasp Series: Dynamic`,
      material: `Crayon or pencil, paper`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Consistently grasps crayon or pencil using mature, controlled, dynamic grasp and makes a mark on paper.` },
        { score: 1, description: `Inconsistently uses dynamic grasp and marks on paper.` },
        { score: 0, description: `Uses less advanced grasp.` }
      ],
    },
    {
      number: 46,
      description: `Copies Square`,
      material: `Response Booklet, crayon or pencil`,
      startPoint: `O-Q`,
      criteria: [
        { score: 2, description: `Makes a four-sided figure with 4 distinct corners and no gap larger than ¼ in. at corners.` },
        { score: 1, description: `Makes a four-sided figure but corners are rounded or figure is clearly rectangular.` },
        { score: 0, description: `Does not make a four-sided figure.` }
      ],
    },
  ],
};

export const grossMotorData: DomainData = {
  id: "grossMotor",
  name: "Gross Motor",
  description: `Measures gross motor skills including static positioning, dynamic movement, balance, and motor planning.`,
  administration: "Direct",
  reverseRule: "If the child obtains an imperfect score on any of the first 3 items, find the previous age start point and administer those items in a forward direction.",
  discontinueRule: "Discontinue when the child receives scores of 0 for 5 consecutive items.",
  startPoints: [
    { letter: "A", ageRange: "0 months 16 days - 1 month 30 days", firstItem: 1 },
    { letter: "B", ageRange: "2 months 0 days - 2 months 30 days", firstItem: 1 },
    { letter: "C", ageRange: "3 months 0 days - 3 months 30 days", firstItem: 1 },
    { letter: "D", ageRange: "4 months 0 days - 4 months 30 days", firstItem: 1 },
    { letter: "E", ageRange: "5 months 0 days - 5 months 30 days", firstItem: 5 },
    { letter: "F", ageRange: "6 months 0 days - 6 months 30 days", firstItem: 5 },
    { letter: "G", ageRange: "7 months 0 days - 7 months 30 days", firstItem: 13 },
    { letter: "H", ageRange: "8 months 0 days - 10 months 30 days", firstItem: 13 },
    { letter: "I", ageRange: "11 months 0 days - 13 months 30 days", firstItem: 25 },
    { letter: "J", ageRange: "14 months 0 days - 16 months 30 days", firstItem: 30 },
    { letter: "K", ageRange: "17 months 0 days - 19 months 30 days", firstItem: 30 },
    { letter: "L", ageRange: "20 months 0 days - 22 months 30 days", firstItem: 36 },
    { letter: "M", ageRange: "23 months 0 days - 25 months 30 days", firstItem: 36 },
    { letter: "N", ageRange: "26 months 0 days - 28 months 30 days", firstItem: 36 },
    { letter: "O", ageRange: "29 months 0 days - 32 months 30 days", firstItem: 36 },
    { letter: "P", ageRange: "33 months 0 days - 38 months 30 days", firstItem: 40 },
    { letter: "Q", ageRange: "39 months 0 days - 42 months 30 days", firstItem: 40 },
  ],
  items: [
    {
      number: 1,
      description: `Thrusts Arms and Legs`,
      material: `None`,
      startPoint: `A - D`,
      criteria: [
        { score: 2, description: `Thrusts arms and legs at least 1 time in a smooth, coordinated fashion.` },
        { score: 1, description: `Thrusts arms and legs but movements are not In a smooth, coordinated fashion.` },
        { score: 0, description: `Shows asymmetry In movement, thrusting 1 side only or not moving both arms and legs.` }
      ],
    },
    {
      number: 2,
      description: `Controls Head Upright Series: 3 Seconds`,
      material: `Timer`,
      startPoint: `A - D`,
      criteria: [
        { score: 2, description: `Holds head erect without support for at least 3 seconds.` },
        { score: 1, description: `Lifts head without support intermittently for 1 to 2 seconds.` },
        { score: 0, description: `Does not lift head.` }
      ],
    },
    {
      number: 3,
      description: `Turns Head to Each Side`,
      material: `Object of interest`,
      startPoint: `A - D`,
      criteria: [
        { score: 2, description: `Turns head from 1 side to the other on both sides.` },
        { score: 1, description: `Turns head from 1 side to the other on 1 side.` },
        { score: 0, description: `Does not turn head from 1 side to the other on either side.` }
      ],
    },
    {
      number: 4,
      description: `Controls Head: Supine Suspension`,
      material: `None`,
      startPoint: `A - D`,
      criteria: [
        { score: 2, description: `Maintains head in midline or child lifts head up slightly.` },
        { score: 1, description: `Maintains head in midline briefly before dropping backward.` },
        { score: 0, description: `Does not maintain head in midline even briefly and needs support constantly.` }
      ],
    },
    {
      number: 5,
      description: `Controls Head: Prone Suspension`,
      material: `None`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Maintains head in midline or child lifts head up slightly.` },
        { score: 1, description: `Maintains head in midline briefly before dropping forward.` },
        { score: 0, description: `Does not maintain head in midline even briefly or head drops as child is lifted.` }
      ],
    },
    {
      number: 6,
      description: `Controls Head Upright Series: 15 Seconds`,
      material: `Timer`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Holds head erect, steady, and without support for at least 15 seconds.` },
        { score: 1, description: `Holds head erect, steady, and without support for 10 to 14 seconds.` },
        { score: 0, description: `Holds head erect, steady, and without support for 0 to 9 seconds.` }
      ],
    },
    {
      number: 7,
      description: `Controls Head Prone Series: 45°`,
      material: `Object of interest`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Maintains a raised head at least 45° for at least 3 seconds.` },
        { score: 1, description: `Maintains a raised head at least 45° for less than 3 seconds.` },
        { score: 0, description: `Does not raise head at least 45°.` }
      ],
    },
    {
      number: 8,
      description: `Rights Head`,
      material: `None`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Consistently keeps head balanced and in same plane as body; may overcompensate by tilting head toward vertical plane.` },
        { score: 1, description: `Keeps head balanced briefly but not in all 4 planes; head balance is inconsistent.` },
        { score: 0, description: `Head does not adjust position when shifted from vertical plane; head control is unsteady.` }
      ],
    },
    {
      number: 9,
      description: `Downward Parachute`,
      material: `None`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Legs extend and legs and feet rotate outward symmetrically.` },
        { score: 1, description: `Legs only partially extend with only slight rotation outward that is symmetric.` },
        { score: 0, description: `Keeps legs tucked, response is asymmetric, or legs scissor (cross).` }
      ],
    },
    {
      number: 10,
      description: `Rolls: Stomach to Back`,
      material: `Bell, rattle`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Consistently able to roll from stomach to back from either side. | Almost every time.` },
        { score: 1, description: `Inconsistently able to roll from stomach to back from either side or typically rolls from stomach to side. | Some of the time.` },
        { score: 0, description: `Does not roll from stomach to back. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Can [insert child's name] successfully roll from [his/her] stomach to [his/her] back almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 11,
      description: `Elevates Chest While Prone`,
      material: `Object of interest`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `Elevates head and chest by pushing up on both hands.` },
        { score: 1, description: `Elevates head and chest by pushing up on elbows or forearms.` },
        { score: 0, description: `Does not elevate head and chest or uses legs to elevate abdomen.` }
      ],
    },
    {
      number: 12,
      description: `ATNR`,
      material: `None`,
      startPoint: `E - F`,
      criteria: [
        { score: 2, description: `No spontaneous asymmetric tonic neck posture observed.` },
        { score: 1, description: `Spontaneous tonic neck posture is transient and is absent most of the time..` },
        { score: 0, description: `Displays tonic neck posture frequently when supine.` }
      ],
    },
    {
      number: 13,
      description: `Supported Sitting Series: 10 Seconds`,
      material: `Timer`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Sits with slight support for at least 10 seconds.` },
        { score: 1, description: `Sits with slight support for 5 to 9 seconds.` },
        { score: 0, description: `Sits with slight support for 0 to 4 seconds.` }
      ],
    },
    {
      number: 14,
      description: `Forward Parachute`,
      material: `None`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Extends both arms, hands open, and neck extends.` },
        { score: 1, description: `Extends both arms partially with at least slight neck extension; hands may not open.` },
        { score: 0, description: `Does not extend arms or only extends 1 arm.` }
      ],
    },
    {
      number: 15,
      description: `Controls Head Prone Series: 90°`,
      material: `Object of interest`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Maintains a raised head at least 90° for at least 5 seconds; abdomen, hips, and thighs should remain on exam surface.` },
        { score: 1, description: `Maintains a raised head at least 90° for less than 5 seconds; abdomen, hips, and thighs could lift off exam surface briefly.` },
        { score: 0, description: `Does not raise head at least 90°.` }
      ],
    },
    {
      number: 16,
      description: `Supported Sitting Series: 30 Seconds`,
      material: `Timer`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Sits with slight support for at least 30 seconds.` },
        { score: 1, description: `Sits with slight support for 15 to 29 seconds.` },
        { score: 0, description: `Sits with slight support for 0 to 14 seconds.` }
      ],
      notes: [`Elapsed Time`],
    },
    {
      number: 17,
      description: `Rolls: Back to Side`,
      material: `Bell, rattle`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Consistently able to roll from back to side.` },
        { score: 1, description: `Inconsistently able to roll from back to side.` },
        { score: 0, description: `Does not roll from back to side.` }
      ],
    },
    {
      number: 18,
      description: `Unsupported Sitting Series: 10 Seconds`,
      material: `Timer`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Sits without support for at least 10 seconds.` },
        { score: 1, description: `Sits without support for 5 to 9 seconds.` },
        { score: 0, description: `Sits without support for 0 to 4 seconds or uses arms to prop self up.` }
      ],
      notes: [`Comments`],
    },
    {
      number: 19,
      description: `Foot Grasp (Plantar)`,
      material: `None`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `No toe flexion around thumbs.` },
        { score: 1, description: `Some toe flexion but is not strong or is not maintained for several seconds.` },
        { score: 0, description: `Strong, maintained toe flexion.` }
      ],
    },
    {
      number: 20,
      description: `Stands: Back Straight`,
      material: `None`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Trunk and head are perpendicular to floor.` },
        { score: 1, description: `Leans forward, bends at hips, or hips are slightly flexed and legs bent.` },
        { score: 0, description: `Does not support weight or locks legs in hyperextension, bending torso forward at least 45°.` }
      ],
    },
    {
      number: 21,
      description: `Pulls Up to Sit`,
      material: `None`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Actively pulls and head leans forward (chin toward chest) to pull up to sit.` },
        { score: 1, description: `Actively pulls and head is in line with body.` },
        { score: 0, description: `Does not actively pull and head lags in pull to sit or locks back (axial tone) and pulls to standing.` }
      ],
    },
    {
      number: 22,
      description: `Grasps Feet`,
      material: `None`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Frequent bringing of 1 or both feet up to hands and grasping a foot or bringing foot to mouth. | Almost every time.` },
        { score: 1, description: `Occasional bringing of 1 or both feet up to hands and grasping a foot or bringing foot to mouth. | Some of the time.` },
        { score: 0, description: `Does not bring 1 or both feet up to hands. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Does [insert child's name] grab [his/her) feet or put them in [his/her] mouth almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 23,
      description: `Rolls: Back to Stomach`,
      material: `Bell, rattle`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Consistently able to roll from back to stomach from either side. | Almost every time.` },
        { score: 1, description: `Inconsistently able to roll from back to stomach from either side or typically rolls from back to side. | Some of the time.` },
        { score: 0, description: `Does not roll from back to stomach. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Can [insert child's name] successfully roll from [his/her] back to [his/her] stomach almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 24,
      description: `Unsupported Sitting Series: 30 Seconds`,
      material: `Timer`,
      startPoint: `G - H`,
      criteria: [
        { score: 2, description: `Sits without support for at least 30 seconds with back straight (i.e., perpendicular to surface).` },
        { score: 1, description: `Sits without support for 11 to 29 seconds with either back straight or leaning forward slightly.` },
        { score: 0, description: `Sits without support for 0 to 10 seconds.` }
      ],
    },
    {
      number: 25,
      description: `Early Stepping Movements`,
      material: `None`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Makes at least 4 stepping movements that propel forward.` },
        { score: 1, description: `Makes at least 2 stepping movements that propel forward.` },
        { score: 0, description: `Does not make at least 2 stepping movements or holds legs stiffly.` }
      ],
    },
    {
      number: 26,
      description: `Crawls Series: On Stomach`,
      material: `Object of interest`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Crawls forward on stomach (e.g., commando crawl) using both arms for at least 3 ft. | Almost every time.` },
        { score: 1, description: `Moves forward by scooting on buttocks or gets up on hands and knees and rocks or goes backward. | Some of the time.` },
        { score: 0, description: `Does not move forward or backward or get up on hands and knees and rock. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Does [insert child's name] crawl on [his/her] hands and knees? If the caregiver says yes, score 2. If the caregiver says no, ask, When [insert child's name] wants to move from one place to another, can [he/she] army or commando crawl or crawl on [his/her] stomach for at 3 feet almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 27,
      description: `Transitions From Sitting to Hands and Knees`,
      material: `Object of interest`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Moves from a seated position to hands and knees with good balance. | Almost every time.` },
        { score: 1, description: `Does not move from a seated position to hands and knees with good balance. | Some of the time.` },
        { score: 0, description: `Loses balance when changing position or does not move from seated position to hands and knees. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] wants to get up and start crawling, can [he/she] go from a sitting to a crawling position without tipping over or falling down almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 28,
      description: `Supports Weight`,
      material: `Timer`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Supports own weight for at least 4 seconds using your hands for balance only.` },
        { score: 1, description: `Supports own weight for 2 to 3 seconds using your hands for balance only.` },
        { score: 0, description: `Supports own weight for 0 to 1 seconds using your hands for balance only or requires support to remain standing.` }
      ],
    },
    {
      number: 29,
      description: `Crawls Series: Crawl Movement`,
      material: `Object of interest`,
      startPoint: `I`,
      criteria: [
        { score: 2, description: `Crawls forward on hands and knees (or feet) for at least 5 ft. | Almost every time.` },
        { score: 1, description: `Crawls forward on hands and knees (or feet) for less than 5 ft. | Some of the time.` },
        { score: 0, description: `Does not crawl forward on hands and knees (or feet). | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] wants to move from one place to another, can [he/she] crawl on [his/her] hands and knees for at least 5 feet almost every time [he/she} tries, some of the time, or none of the time?`,
    },
    {
      number: 30,
      description: `Raises Self to Standing`,
      material: `Object of interest`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Rises to a standing position using a chair or other convenient object 2 for support. | Almost every time.` },
        { score: 1, description: `Attempts to rise to a standing position but cannot pull up completely. | Some of the time.` },
        { score: 0, description: `Does not attempt to rise to a standing position or loses balance immediately. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Can [insert child's name] successfully pull up on furniture to a standing position almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 31,
      description: `Walks Series: With Support`,
      material: `None`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Takes at least 4 steps with support with good coordination.` },
        { score: 1, description: `Takes at least 2 steps with support with good coordination or more than 2 steps without good coordination.` },
        { score: 0, description: `Does not take any steps or relies completely on support to move forward.` }
      ],
    },
    {
      number: 32,
      description: `Walks Sideways With Support (Cruises)`,
      material: `Object of interest`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Walks sideways at least 2 steps with support. | Almost every time.` },
        { score: 1, description: `Attempts to walk sideways but does not take at least 2 steps. | Some of the time.` },
        { score: 0, description: `Does not walk sideways. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: When [insert child's name] wants to move from one place to another, can [he/she] walk sideways while holding onto the furniture almost every time [he/she} tries, some of the time, or none of the time?`,
    },
    {
      number: 33,
      description: `Sits Down With Control`,
      material: `None`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Purposely lowers from a standing to a sitting position in a controlled manner through the entire movement.` },
        { score: 1, description: `Purposely lowers from a standing to a sitting position in a controlled manner through part of the movement; may slowly lower to knees.` },
        { score: 0, description: `Falls to a sitting position (e.g., plops down).` }
      ],
    },
    {
      number: 34,
      description: `Stands Alone`,
      material: `Timer`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Stands alone for at least 5 seconds after hands are released.` },
        { score: 1, description: `Stands alone for 3 to 4 seconds after hands are released.` },
        { score: 0, description: `Stands alone for 0 to 2 seconds.` }
      ],
    },
    {
      number: 35,
      description: `Stands Up Alone`,
      material: `None`,
      startPoint: `J - K`,
      criteria: [
        { score: 2, description: `Rolls to 1 side and stands without using any support.` },
        { score: 1, description: `Rolls into a prone or quadruped (hands and feet on floor) position and stands without using any support.` },
        { score: 0, description: `Does not stand up or stands up only with support.` }
      ],
    },
    {
      number: 36,
      description: `Walks Series: Witout Support`,
      material: `None`,
      startPoint: `L - O`,
      criteria: [
        { score: 2, description: `Takes at least 5 steps without support with good coordination and ithout using arms for balance.` },
        { score: 1, description: `Takes at least 3 steps without support but without good coordination and uses arms for balance (e.g., medium or high guard).` },
        { score: 0, description: `Does not take at least 3 steps without support, gait is asymmetric, or does not attempt to walk.` }
      ],
    },
    {
      number: 37,
      description: `Throws Ball Forward`,
      material: `Small ball`,
      startPoint: `L - O`,
      criteria: [
        { score: 2, description: `Purposely throws ball forward using either an underhand or overhand motion. | Almost every time.` },
        { score: 1, description: `Attempts to throw ball forward using either an underhand or overhand motion but ball goes straight up or backward. | Some of the time.` },
        { score: 0, description: `Drops or rolls ball. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Is [insert child's name] able to successfully throw a ball forward almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 38,
      description: `Unsupported Squat`,
      material: `Object of interest`,
      startPoint: `L - O`,
      criteria: [
        { score: 2, description: `Smoothly moves from standing to squatting to standing while maintaining balance without using any support.` },
        { score: 1, description: `Moves from standing to squatting to standing but may stumble a bit or need slight support, such as stabilizing with 1 hand on floor.` },
        { score: 0, description: `Sits down to retrieve object or needs support to pick up object.` }
      ],
    },
    {
      number: 39,
      description: `Walks Up Stairs Series: Both Feet on Each Step Without Support`,
      material: `Stairs`,
      startPoint: `L - O`,
      criteria: [
        { score: 2, description: `Walks up at least 3 steps without support, placing both feet on each step before stepping up to the next.` },
        { score: 1, description: `Walks up at least 3 steps with support, placing both feet on each step before stepping up to the next.` },
        { score: 0, description: `Does not walk up at least 3 steps.` }
      ],
    },
    {
      number: 40,
      description: `Walks Backward`,
      material: `None`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Takes at least 3 steps backward without support and shows good balance.` },
        { score: 1, description: `Takes 2 steps backward without support; slight loss of balance acceptable.` },
        { score: 0, description: `Does not take at least 2 steps backward without support or walks backward and loses balance after 1 to 2 steps` }
      ],
    },
    {
      number: 41,
      description: `Walks Down Stairs Series: Both Feet on Each Step Without Support`,
      material: `Stairs`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Walks down at least 3 steps without support, placing both feet on each step before stepping down to the next.` },
        { score: 1, description: `Walks down at least 3 steps with support, placing both feet on each step before stepping down to the next.` },
        { score: 0, description: `Does not walk down at least 3 steps.` }
      ],
    },
    {
      number: 42,
      description: `Coordinated Run`,
      material: `Large ball`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Runs with good coordination.` },
        { score: 1, description: `Runs but is slightly uncoordinated or a bit stiff.` },
        { score: 0, description: `Runs with uneven gait, with legs spread more than shoulder width apart or child trips; arms might posture or 1 or both hands fist.` }
      ],
    },
    {
      number: 43,
      description: `Balances on Each Foot With Support`,
      material: `Timer`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Balances on both left and right foot with support for at least 2 seconds.` },
        { score: 1, description: `Balances on only right or only left foot with support for at least 2 seconds.` },
        { score: 0, description: `Does not balance on either foot for at least 2 seconds or balances on either foot but requires support beyond just holding child's hand.` }
      ],
    },
    {
      number: 44,
      description: `Jumps: Bottom Step`,
      material: `Stairs`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Jumps to floor with feet together and both feet are in the air at some point during jump, and lands with balance. | Almost every time.` },
        { score: 1, description: `Jumps to floor with 1 foot leading and both feet are in the air at some point during jump, but does not land with balance. | Some of the time.` },
        { score: 0, description: `Does not jump to floor or jumps up but lands on same step, or walks down step rather than jumping. |None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Does [insert child's name] jump from the bottom step and land without stumbling or falling down almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 45,
      description: `Kicks Ball`,
      material: `Large ball`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Maintains balance while kicking ball in a forward direction at least 2 ft.` },
        { score: 1, description: `Kicks ball, but it moves forward less than 2 ft or child loses balance in the process of kicking.` },
        { score: 0, description: `Makes kicking motion but misses ball, or kicks ball but requires support to maintain balance.` }
      ],
    },
    {
      number: 46,
      description: `Walks on Path: Forward`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Takes at least 2 steps with both feet on stepping path and keeps 1 foot on path for at least 5 ft.` },
        { score: 1, description: `Walks for at least 5 ft and keeps at least 1 foot on stepping path.` },
        { score: 0, description: `Does not keep 1 foot on stepping path or does not walk a distance of at least 5 ft.` }
      ],
    },
    {
      number: 47,
      description: `Jumps Forward Series: 6 inches`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Jumps at least 6 in. for any trial.` },
        { score: 1, description: `Jumps 1 to 5 in. for any trial.` },
        { score: 0, description: `Does not jump any distance for any trial.` }
      ],
    },
    {
      number: 48,
      description: `Jumps: Both Feet`,
      material: `None`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Jumps off floor with feet together or leads with 1 foot and both feet are in the air at some point during the jump. | Almost every time.` },
        { score: 1, description: `Jumps but only 1 foot is in the air. | Some of the time.` },
        { score: 0, description: `Bends legs in an attempt to jump, but both feet remain in contact with floor. | None of the time.` }
      ],
      caregiverQuestion: `Caregiver Question: Is [insert child's name] able to jump off the floor with both feet in the air at the same time almost every time [he/she] tries, some of the time, or none of the time?`,
    },
    {
      number: 49,
      description: `Balances on Each Foot Without Support: 2 Seconds`,
      material: `Timer`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Balances on both left and right foot without support for at least 2 seconds.` },
        { score: 1, description: `Balances on only right or only left foot without support for at least 2 seconds.` },
        { score: 0, description: `Does not balance on either foot for at least 2 seconds or requires support to maintain balance.` }
      ],
    },
    {
      number: 50,
      description: `Walks on Tiptoes`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Takes at least 4 steps without touching heels to floor.` },
        { score: 1, description: `Takes 1 to 3 steps without touching heels to floor.` },
        { score: 0, description: `Does not take any steps without touching heels to floor.` }
      ],
    },
    {
      number: 51,
      description: `Walks on Path: Backward`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Walks backward within approximately 6 in. of stepping path for at least 5 ft.` },
        { score: 1, description: `Walks backward close to path for several steps.` },
        { score: 0, description: `Stumbles walking backward, requires support, or cannot walk backward.` }
      ],
    },
    {
      number: 52,
      description: `Walks Up Stairs Series: Alternating Feet Without Support`,
      material: `Stairs`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Walks up at least 3 steps without support, alternating feet on each step.` },
        { score: 1, description: `Walks up 2 steps without support, alternating feet on each step.` },
        { score: 0, description: `Does not walk up at least 2 steps without support, alternating feet on each step.` }
      ],
    },
    {
      number: 53,
      description: `Stops From a Full Run`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Stops In a controlled fashion within 2 steps of end of stepping path on either trial.` },
        { score: 1, description: `Stops within 3 or more steps of end of stepping path on either trial; might stumble at end.` },
        { score: 0, description: `Does not stop at end of stepping path, stops by sitting down or squatting, or loses balance when attempting to stop.` }
      ],
    },
    {
      number: 54,
      description: `Walks Down Stairs Series: Alternating Feet Without Support`,
      material: `Stairs`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Walks down at least 3 steps without support, alternating feet on each step.` },
        { score: 1, description: `Walks down 2 steps without support, alternating feet on each step.` },
        { score: 0, description: `Does not walk down at least 2 steps without support, alternating feet on each step.` }
      ],
    },
    {
      number: 55,
      description: `Hops 5 Ft`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Hops on 1 foot for a distance of at feast 5 ft.` },
        { score: 1, description: `Hops on 1 foot several times but less than 5 ft.` },
        { score: 0, description: `Hops in place, stumbles, or does not hop.` }
      ],
    },
    {
      number: 56,
      description: `Balances on Each Foot Without Support Series: 6 Seconds`,
      material: `Timer`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Balances on both left and right foot without support for at least 6 seconds.` },
        { score: 1, description: `Balances on only right or only left foot without support for at least 6 seconds.` },
        { score: 0, description: `Does not balance on either foot for at least 6 seconds or requires support to maintain balance.` }
      ],
    },
    {
      number: 57,
      description: `Walks Heel to Toe`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Completes at least 6 heel-to-toe steps for either trial.` },
        { score: 1, description: `Completes 4 to 5 heel-to-toe steps for either trial.` },
        { score: 0, description: `Does not complete at least 4 heel-to-toe steps for either trial.` }
      ],
    },
    {
      number: 58,
      description: `Jumps Forward Series: 24 inches`,
      material: `Stepping Path`,
      startPoint: `P - Q`,
      criteria: [
        { score: 2, description: `Jumps at least 24 in. for any trial.` },
        { score: 1, description: `Jumps 12 to 23 in. for any trial.` },
        { score: 0, description: `Does not jump at least 12 in. for any trial.` }
      ],
    },
  ],
};

// Language Domain — Receptive Communication items
const receptiveItems: AssessmentItem[] = [
  { number: 1, description: 'Responds to a voice by quieting or alerting.', startPoint: 'A-D', criteria: [{ score: 2, description: 'Consistently responds' }, { score: 1, description: 'Inconsistently responds' }, { score: 0, description: 'Does not respond' }] },
  { number: 2, description: 'Turns head toward a sound source.', startPoint: 'A-D', criteria: [{ score: 2, description: 'Consistently turns' }, { score: 1, description: 'Inconsistently turns' }, { score: 0, description: 'Does not turn' }] },
  { number: 3, description: 'Responds to own name by looking or turning.', startPoint: 'E', criteria: [{ score: 2, description: 'Consistently responds' }, { score: 1, description: 'Inconsistently responds' }, { score: 0, description: 'Does not respond' }] },
  { number: 4, description: 'Responds to "no" by stopping or pausing activity.', startPoint: 'E', criteria: [{ score: 2, description: 'Consistently stops' }, { score: 1, description: 'Inconsistently stops' }, { score: 0, description: 'Does not stop' }] },
  { number: 5, description: 'Responds to familiar words (e.g., "bottle," "mama").', startPoint: 'F-H', criteria: [{ score: 2, description: 'Responds to 3+ words' }, { score: 1, description: 'Responds to 1-2 words' }, { score: 0, description: 'Does not respond' }] },
  { number: 6, description: 'Follows a simple command with gesture (e.g., "Come here" with arms open).', startPoint: 'F-H', criteria: [{ score: 2, description: 'Consistently follows' }, { score: 1, description: 'Inconsistently follows' }, { score: 0, description: 'Does not follow' }] },
  { number: 7, description: 'Identifies one object when named.', startPoint: 'I', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 8, description: 'Identifies three objects when named.', startPoint: 'I', criteria: [{ score: 2, description: 'Identifies 3+ objects' }, { score: 1, description: 'Identifies 1-2 objects' }, { score: 0, description: 'Does not identify' }] },
  { number: 9, description: 'Follows a simple command without gesture.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Consistently follows' }, { score: 1, description: 'Inconsistently follows' }, { score: 0, description: 'Does not follow' }] },
  { number: 10, description: 'Points to one body part when asked.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Points correctly' }, { score: 1, description: 'Inconsistently points' }, { score: 0, description: 'Does not point' }] },
  { number: 11, description: 'Points to three body parts when asked.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Points to 3+ parts' }, { score: 1, description: 'Points to 1-2 parts' }, { score: 0, description: 'Does not point' }] },
  { number: 12, description: 'Identifies one picture when named.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 13, description: 'Identifies three pictures when named.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Identifies 3+ pictures' }, { score: 1, description: 'Identifies 1-2 pictures' }, { score: 0, description: 'Does not identify' }] },
  { number: 14, description: 'Understands action words (e.g., "eating," "sleeping").', startPoint: 'L-N', criteria: [{ score: 2, description: 'Understands 3+ action words' }, { score: 1, description: 'Understands 1-2 action words' }, { score: 0, description: 'Does not understand' }] },
  { number: 15, description: 'Points to clothing items when named.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Points to 3+ items' }, { score: 1, description: 'Points to 1-2 items' }, { score: 0, description: 'Does not point' }] },
  { number: 16, description: 'Identifies five pictures when named.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Identifies 5+ pictures' }, { score: 1, description: 'Identifies 3-4 pictures' }, { score: 0, description: 'Identifies fewer than 3' }] },
  { number: 17, description: 'Follows two-step related commands.', startPoint: 'O', criteria: [{ score: 2, description: 'Follows both steps' }, { score: 1, description: 'Follows one step' }, { score: 0, description: 'Does not follow' }] },
  { number: 18, description: 'Understands possessive forms (e.g., "mommy\'s shoe").', startPoint: 'O', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 19, description: 'Identifies objects by function (e.g., "Which one do we eat with?").', startPoint: 'O', criteria: [{ score: 2, description: 'Identifies 3+ objects' }, { score: 1, description: 'Identifies 1-2 objects' }, { score: 0, description: 'Does not identify' }] },
  { number: 20, description: 'Understands size concepts (big/little).', startPoint: 'O', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 21, description: 'Identifies actions in pictures.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies 3+ actions' }, { score: 1, description: 'Identifies 1-2 actions' }, { score: 0, description: 'Does not identify' }] },
  { number: 22, description: 'Follows two-step unrelated commands.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Follows both steps' }, { score: 1, description: 'Follows one step' }, { score: 0, description: 'Does not follow' }] },
  { number: 23, description: 'Understands pronouns (he, she, they).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 24, description: 'Understands prepositions (in, on, under).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Understands 3+ prepositions' }, { score: 1, description: 'Understands 1-2 prepositions' }, { score: 0, description: 'Does not understand' }] },
  { number: 25, description: 'Identifies colors when named.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies 3+ colors' }, { score: 1, description: 'Identifies 1-2 colors' }, { score: 0, description: 'Does not identify' }] },
  { number: 26, description: 'Understands quantity concepts (one, all, more).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Understands 3+ concepts' }, { score: 1, description: 'Understands 1-2 concepts' }, { score: 0, description: 'Does not understand' }] },
  { number: 27, description: 'Follows three-step commands.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Follows all 3 steps' }, { score: 1, description: 'Follows 1-2 steps' }, { score: 0, description: 'Does not follow' }] },
  { number: 28, description: 'Understands comparatives (bigger, smaller, longer).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 29, description: 'Identifies objects by two attributes (e.g., "big red ball").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 30, description: 'Understands negation (e.g., "not the big one").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 31, description: 'Understands past tense verbs.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 32, description: 'Understands "if-then" statements.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 33, description: 'Identifies objects described by category (e.g., "Find the animal").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 34, description: 'Understands superlatives (biggest, smallest).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 35, description: 'Follows complex directions with embedded clauses.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Follows correctly' }, { score: 1, description: 'Partially follows' }, { score: 0, description: 'Does not follow' }] },
  { number: 36, description: 'Understands temporal concepts (before, after, first, last).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Understands 3+ concepts' }, { score: 1, description: 'Understands 1-2 concepts' }, { score: 0, description: 'Does not understand' }] },
  { number: 37, description: 'Identifies objects by exclusion (e.g., "Find the one that is NOT a fruit").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 38, description: 'Understands passive voice sentences.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 39, description: 'Follows directions with multiple modifiers.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Follows correctly' }, { score: 1, description: 'Partially follows' }, { score: 0, description: 'Does not follow' }] },
  { number: 40, description: 'Understands complex question forms (why, how, when).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
  { number: 41, description: 'Identifies absurdities in sentences or pictures.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Identifies correctly' }, { score: 1, description: 'Partial identification' }, { score: 0, description: 'Does not identify' }] },
  { number: 42, description: 'Understands figurative language (simple idioms).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Consistently understands' }, { score: 1, description: 'Inconsistently understands' }, { score: 0, description: 'Does not understand' }] },
];

// Language Domain — Expressive Communication items
const expressiveItems: AssessmentItem[] = [
  { number: 1, description: 'Produces vowel-like sounds (cooing).', startPoint: 'A-D', criteria: [{ score: 2, description: 'Produces varied vowel sounds' }, { score: 1, description: 'Produces limited vowel sounds' }, { score: 0, description: 'Does not produce vowel sounds' }] },
  { number: 2, description: 'Laughs or chuckles.', startPoint: 'A-D', criteria: [{ score: 2, description: 'Laughs frequently' }, { score: 1, description: 'Laughs occasionally' }, { score: 0, description: 'Does not laugh' }] },
  { number: 3, description: 'Produces consonant-vowel combinations (babbling).', startPoint: 'E', criteria: [{ score: 2, description: 'Produces varied CV combinations' }, { score: 1, description: 'Produces limited CV combinations' }, { score: 0, description: 'Does not babble' }] },
  { number: 4, description: 'Uses gestures to communicate (reaching, pointing).', startPoint: 'E', criteria: [{ score: 2, description: 'Uses multiple gestures' }, { score: 1, description: 'Uses limited gestures' }, { score: 0, description: 'Does not use gestures' }] },
  { number: 5, description: 'Produces varied babbling with different consonants.', startPoint: 'F-H', criteria: [{ score: 2, description: 'Uses 3+ consonants' }, { score: 1, description: 'Uses 1-2 consonants' }, { score: 0, description: 'Does not vary consonants' }] },
  { number: 6, description: 'Uses jargon (babbling with sentence-like intonation).', startPoint: 'F-H', criteria: [{ score: 2, description: 'Frequently uses jargon' }, { score: 1, description: 'Occasionally uses jargon' }, { score: 0, description: 'Does not use jargon' }] },
  { number: 7, description: 'Says first true word (other than "mama" or "dada").', startPoint: 'I', criteria: [{ score: 2, description: 'Uses word consistently' }, { score: 1, description: 'Uses word inconsistently' }, { score: 0, description: 'No true words' }] },
  { number: 8, description: 'Uses 3 or more words consistently.', startPoint: 'I', criteria: [{ score: 2, description: 'Uses 3+ words' }, { score: 1, description: 'Uses 1-2 words' }, { score: 0, description: 'No consistent words' }] },
  { number: 9, description: 'Names one object.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Names correctly' }, { score: 1, description: 'Approximates name' }, { score: 0, description: 'Does not name' }] },
  { number: 10, description: 'Uses 8 or more words.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Uses 8+ words' }, { score: 1, description: 'Uses 4-7 words' }, { score: 0, description: 'Uses fewer than 4 words' }] },
  { number: 11, description: 'Names one picture.', startPoint: 'J-K', criteria: [{ score: 2, description: 'Names correctly' }, { score: 1, description: 'Approximates name' }, { score: 0, description: 'Does not name' }] },
  { number: 12, description: 'Combines two words (e.g., "more milk," "daddy go").', startPoint: 'L-N', criteria: [{ score: 2, description: 'Combines words frequently' }, { score: 1, description: 'Combines words occasionally' }, { score: 0, description: 'Does not combine words' }] },
  { number: 13, description: 'Uses 20 or more words.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Uses 20+ words' }, { score: 1, description: 'Uses 10-19 words' }, { score: 0, description: 'Uses fewer than 10 words' }] },
  { number: 14, description: 'Names three pictures.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Names 3+ pictures' }, { score: 1, description: 'Names 1-2 pictures' }, { score: 0, description: 'Does not name pictures' }] },
  { number: 15, description: 'Uses three-word phrases.', startPoint: 'L-N', criteria: [{ score: 2, description: 'Uses 3-word phrases frequently' }, { score: 1, description: 'Uses 3-word phrases occasionally' }, { score: 0, description: 'Does not use 3-word phrases' }] },
  { number: 16, description: 'Uses pronouns (I, me, you).', startPoint: 'O', criteria: [{ score: 2, description: 'Uses 3+ pronouns' }, { score: 1, description: 'Uses 1-2 pronouns' }, { score: 0, description: 'Does not use pronouns' }] },
  { number: 17, description: 'Uses plural forms (e.g., "dogs," "cats").', startPoint: 'O', criteria: [{ score: 2, description: 'Uses plurals consistently' }, { score: 1, description: 'Uses plurals inconsistently' }, { score: 0, description: 'Does not use plurals' }] },
  { number: 18, description: 'Uses possessive forms (e.g., "my," "mine").', startPoint: 'O', criteria: [{ score: 2, description: 'Uses possessives consistently' }, { score: 1, description: 'Uses possessives inconsistently' }, { score: 0, description: 'Does not use possessives' }] },
  { number: 19, description: 'Names five pictures.', startPoint: 'O', criteria: [{ score: 2, description: 'Names 5+ pictures' }, { score: 1, description: 'Names 3-4 pictures' }, { score: 0, description: 'Names fewer than 3' }] },
  { number: 20, description: 'Uses past tense (e.g., "walked," "ate").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses past tense consistently' }, { score: 1, description: 'Uses past tense inconsistently' }, { score: 0, description: 'Does not use past tense' }] },
  { number: 21, description: 'Uses four-word sentences.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses 4-word sentences frequently' }, { score: 1, description: 'Uses 4-word sentences occasionally' }, { score: 0, description: 'Does not use 4-word sentences' }] },
  { number: 22, description: 'Asks "what" and "where" questions.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Asks questions frequently' }, { score: 1, description: 'Asks questions occasionally' }, { score: 0, description: 'Does not ask questions' }] },
  { number: 23, description: 'Uses prepositions in speech (in, on, under).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses 3+ prepositions' }, { score: 1, description: 'Uses 1-2 prepositions' }, { score: 0, description: 'Does not use prepositions' }] },
  { number: 24, description: 'Names actions in pictures.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Names 3+ actions' }, { score: 1, description: 'Names 1-2 actions' }, { score: 0, description: 'Does not name actions' }] },
  { number: 25, description: 'Uses articles (a, the) in speech.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses articles consistently' }, { score: 1, description: 'Uses articles inconsistently' }, { score: 0, description: 'Does not use articles' }] },
  { number: 26, description: 'Asks "why" questions.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Asks why questions frequently' }, { score: 1, description: 'Asks why questions occasionally' }, { score: 0, description: 'Does not ask why questions' }] },
  { number: 27, description: 'Uses five or more word sentences.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses 5+ word sentences frequently' }, { score: 1, description: 'Uses 5+ word sentences occasionally' }, { score: 0, description: 'Does not use 5+ word sentences' }] },
  { number: 28, description: 'Describes function of objects.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Describes 3+ functions' }, { score: 1, description: 'Describes 1-2 functions' }, { score: 0, description: 'Does not describe functions' }] },
  { number: 29, description: 'Uses conjunctions (and, but, because).', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses conjunctions consistently' }, { score: 1, description: 'Uses conjunctions inconsistently' }, { score: 0, description: 'Does not use conjunctions' }] },
  { number: 30, description: 'Tells a simple story with a beginning, middle, and end.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Tells complete story' }, { score: 1, description: 'Tells partial story' }, { score: 0, description: 'Does not tell a story' }] },
  { number: 31, description: 'Uses irregular past tense verbs correctly.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses correctly consistently' }, { score: 1, description: 'Uses correctly inconsistently' }, { score: 0, description: 'Does not use correctly' }] },
  { number: 32, description: 'Defines simple words.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Defines 3+ words' }, { score: 1, description: 'Defines 1-2 words' }, { score: 0, description: 'Does not define words' }] },
  { number: 33, description: 'Uses complex sentences with embedded clauses.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses complex sentences frequently' }, { score: 1, description: 'Uses complex sentences occasionally' }, { score: 0, description: 'Does not use complex sentences' }] },
  { number: 34, description: 'Describes similarities and differences between objects.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Describes both similarities and differences' }, { score: 1, description: 'Describes only similarities or differences' }, { score: 0, description: 'Does not describe' }] },
  { number: 35, description: 'Uses future tense (e.g., "I will go," "I\'m going to").', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses future tense consistently' }, { score: 1, description: 'Uses future tense inconsistently' }, { score: 0, description: 'Does not use future tense' }] },
  { number: 36, description: 'Retells a story with details in correct sequence.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Retells with correct sequence' }, { score: 1, description: 'Retells with some errors' }, { score: 0, description: 'Does not retell' }] },
  { number: 37, description: 'Uses comparative and superlative forms in speech.', startPoint: 'P-Q', criteria: [{ score: 2, description: 'Uses forms correctly' }, { score: 1, description: 'Uses forms inconsistently' }, { score: 0, description: 'Does not use forms' }] },
];

export const receptiveCommunicationData: DomainData = {
  id: 'receptiveCommunication',
  name: 'Receptive Communication',
  description: 'Evaluates receptive communication skills including preverbal behaviors, vocabulary development, and understanding of morpho-syntactic rules.',
  administration: 'Direct',
  reverseRule: 'If the child obtains an imperfect score on any of the first 3 items, find the previous age start point and administer those items in a forward direction.',
  discontinueRule: 'Discontinue when the child receives scores of 0 for 5 consecutive items.',
  startPoints: [
    { letter: 'A', ageRange: '0 months 16 days - 1 month 30 days', firstItem: 1 },
    { letter: 'B', ageRange: '2 months 0 days - 2 months 30 days', firstItem: 1 },
    { letter: 'C', ageRange: '3 months 0 days - 3 months 30 days', firstItem: 1 },
    { letter: 'D', ageRange: '4 months 0 days - 4 months 30 days', firstItem: 1 },
    { letter: 'E', ageRange: '5 months 0 days - 5 months 30 days', firstItem: 3 },
    { letter: 'F', ageRange: '6 months 0 days - 6 months 30 days', firstItem: 5 },
    { letter: 'G', ageRange: '7 months 0 days - 7 months 30 days', firstItem: 5 },
    { letter: 'H', ageRange: '8 months 0 days - 10 months 30 days', firstItem: 5 },
    { letter: 'I', ageRange: '11 months 0 days - 13 months 30 days', firstItem: 7 },
    { letter: 'J', ageRange: '14 months 0 days - 16 months 30 days', firstItem: 9 },
    { letter: 'K', ageRange: '17 months 0 days - 19 months 30 days', firstItem: 9 },
    { letter: 'L', ageRange: '20 months 0 days - 22 months 30 days', firstItem: 12 },
    { letter: 'M', ageRange: '23 months 0 days - 25 months 30 days', firstItem: 12 },
    { letter: 'N', ageRange: '26 months 0 days - 28 months 30 days', firstItem: 12 },
    { letter: 'O', ageRange: '29 months 0 days - 32 months 30 days', firstItem: 17 },
    { letter: 'P', ageRange: '33 months 0 days - 38 months 30 days', firstItem: 21 },
    { letter: 'Q', ageRange: '39 months 0 days - 42 months 30 days', firstItem: 21 },
  ],
  items: receptiveItems,
};

export const expressiveCommunicationData: DomainData = {
  id: 'expressiveCommunication',
  name: 'Expressive Communication',
  description: 'Evaluates expressive communication skills including preverbal communication, vocabulary use, and morpho-syntactic production.',
  administration: 'Direct',
  reverseRule: 'If the child obtains an imperfect score on any of the first 3 items, find the previous age start point and administer those items in a forward direction.',
  discontinueRule: 'Discontinue when the child receives scores of 0 for 5 consecutive items.',
  startPoints: [
    { letter: 'A', ageRange: '0 months 16 days - 1 month 30 days', firstItem: 1 },
    { letter: 'B', ageRange: '2 months 0 days - 2 months 30 days', firstItem: 1 },
    { letter: 'C', ageRange: '3 months 0 days - 3 months 30 days', firstItem: 1 },
    { letter: 'D', ageRange: '4 months 0 days - 4 months 30 days', firstItem: 1 },
    { letter: 'E', ageRange: '5 months 0 days - 5 months 30 days', firstItem: 3 },
    { letter: 'F', ageRange: '6 months 0 days - 6 months 30 days', firstItem: 5 },
    { letter: 'G', ageRange: '7 months 0 days - 7 months 30 days', firstItem: 5 },
    { letter: 'H', ageRange: '8 months 0 days - 10 months 30 days', firstItem: 5 },
    { letter: 'I', ageRange: '11 months 0 days - 13 months 30 days', firstItem: 7 },
    { letter: 'J', ageRange: '14 months 0 days - 16 months 30 days', firstItem: 9 },
    { letter: 'K', ageRange: '17 months 0 days - 19 months 30 days', firstItem: 9 },
    { letter: 'L', ageRange: '20 months 0 days - 22 months 30 days', firstItem: 12 },
    { letter: 'M', ageRange: '23 months 0 days - 25 months 30 days', firstItem: 12 },
    { letter: 'N', ageRange: '26 months 0 days - 28 months 30 days', firstItem: 12 },
    { letter: 'O', ageRange: '29 months 0 days - 32 months 30 days', firstItem: 16 },
    { letter: 'P', ageRange: '33 months 0 days - 38 months 30 days', firstItem: 20 },
    { letter: 'Q', ageRange: '39 months 0 days - 42 months 30 days', firstItem: 20 },
  ],
  items: expressiveItems,
};

export const ALL_DOMAINS: DomainData[] = [cognitiveData, receptiveCommunicationData, expressiveCommunicationData, fineMotorData, grossMotorData];

// Helper: get the start item number for a given domain and start point letter
export function getStartItem(domain: DomainData, startPointLetter: string): number {
  const sp = domain.startPoints.find(s => s.letter === startPointLetter);
  return sp ? sp.firstItem : 1;
}

// Helper: get start point letter for a given age range
export function getStartPointForAge(ageLabel: string): string {
  const range = AGE_RANGES.find(r => r.label === ageLabel);
  return range ? range.startPoint : "A";
}

/**
 * Calculate the child's age in months and days from birthDate to testDate,
 * then return the matching AGE_RANGE label (or null if out of range).
 * Supports premature adjustment: subtract prematureWeeks from the age.
 */
export function calculateAgeRange(
  birthDate: string,
  testDate: string,
  prematureWeeks?: number
): { label: string; startPoint: string; ageDescription: string } | null {
  if (!birthDate || !testDate) return null;

  const birth = new Date(birthDate + 'T00:00:00');
  const test = new Date(testDate + 'T00:00:00');
  if (isNaN(birth.getTime()) || isNaN(test.getTime())) return null;
  if (test < birth) return null;

  // Calculate total days between dates
  let totalDays = Math.floor((test.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  // Adjust for prematurity (subtract premature weeks)
  if (prematureWeeks && prematureWeeks > 0) {
    totalDays -= prematureWeeks * 7;
    if (totalDays < 0) totalDays = 0;
  }

  // Convert to months and remaining days
  // Use a more precise month calculation
  let adjustedDate = new Date(birth.getTime());
  if (prematureWeeks && prematureWeeks > 0) {
    adjustedDate = new Date(adjustedDate.getTime() + prematureWeeks * 7 * 24 * 60 * 60 * 1000);
  }

  let months = (test.getFullYear() - adjustedDate.getFullYear()) * 12 + (test.getMonth() - adjustedDate.getMonth());
  // Check if we've overshot
  const tempDate = new Date(adjustedDate);
  tempDate.setMonth(tempDate.getMonth() + months);
  if (tempDate > test) {
    months--;
  }
  const monthStart = new Date(adjustedDate);
  monthStart.setMonth(monthStart.getMonth() + months);
  const days = Math.floor((test.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));

  const ageDescription = `${months} months ${days} days`;

  // Define age ranges in days for matching
  // Each range: [minMonths, minDays, maxMonths, maxDays]
  const ranges: { minM: number; minD: number; maxM: number; maxD: number; idx: number }[] = [
    { minM: 0, minD: 16, maxM: 1, maxD: 30, idx: 0 },   // A
    { minM: 2, minD: 0, maxM: 2, maxD: 30, idx: 1 },     // B
    { minM: 3, minD: 0, maxM: 3, maxD: 30, idx: 2 },     // C
    { minM: 4, minD: 0, maxM: 4, maxD: 30, idx: 3 },     // D
    { minM: 5, minD: 0, maxM: 5, maxD: 30, idx: 4 },     // E
    { minM: 6, minD: 0, maxM: 6, maxD: 30, idx: 5 },     // F
    { minM: 7, minD: 0, maxM: 7, maxD: 30, idx: 6 },     // G
    { minM: 8, minD: 0, maxM: 10, maxD: 30, idx: 7 },    // H
    { minM: 11, minD: 0, maxM: 13, maxD: 30, idx: 8 },   // I
    { minM: 14, minD: 0, maxM: 16, maxD: 30, idx: 9 },   // J
    { minM: 17, minD: 0, maxM: 19, maxD: 30, idx: 10 },  // K
    { minM: 20, minD: 0, maxM: 22, maxD: 30, idx: 11 },  // L
    { minM: 23, minD: 0, maxM: 25, maxD: 30, idx: 12 },  // M
    { minM: 26, minD: 0, maxM: 28, maxD: 30, idx: 13 },  // N
    { minM: 29, minD: 0, maxM: 32, maxD: 30, idx: 14 },  // O
    { minM: 33, minD: 0, maxM: 38, maxD: 30, idx: 15 },  // P
    { minM: 39, minD: 0, maxM: 42, maxD: 30, idx: 16 },  // Q
  ];

  // Convert months+days to a comparable number (months * 31 + days)
  const ageVal = months * 31 + days;

  for (const r of ranges) {
    const minVal = r.minM * 31 + r.minD;
    const maxVal = r.maxM * 31 + r.maxD;
    if (ageVal >= minVal && ageVal <= maxVal) {
      return {
        label: AGE_RANGES[r.idx].label,
        startPoint: AGE_RANGES[r.idx].startPoint,
        ageDescription,
      };
    }
  }

  return null; // Out of range
}
