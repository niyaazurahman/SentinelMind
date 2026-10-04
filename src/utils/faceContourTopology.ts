/**
 * Official MediaPipe Face Mesh Contour Topology Connections.
 * ONLY official connection index pairs from MediaPipe FaceMesh.
 * NO templates, NO hardcoded coordinates, NO fake shape generators.
 */

export type LandmarkEdge = [number, number];

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

// 1. Official MediaPipe Face Oval Contour (Outer outline / Jawline & Forehead)
export const FACEMESH_FACE_OVAL: LandmarkEdge[] = [
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389], [389, 356],
  [356, 454], [454, 323], [323, 361], [361, 288], [288, 397], [397, 365], [365, 379],
  [379, 378], [378, 400], [400, 377], [377, 152], [152, 148], [148, 176], [176, 149],
  [149, 150], [150, 136], [136, 172], [172, 58], [58, 132], [132, 93], [93, 234],
  [234, 127], [127, 162], [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
];

// 2. Official MediaPipe Left Eye Contour
export const FACEMESH_LEFT_EYE: LandmarkEdge[] = [
  [362, 382], [382, 381], [381, 380], [380, 374], [374, 373], [373, 390], [390, 249],
  [249, 263], [263, 466], [466, 388], [388, 387], [387, 386], [386, 385], [385, 384],
  [384, 398], [398, 362],
];

// 3. Official MediaPipe Right Eye Contour
export const FACEMESH_RIGHT_EYE: LandmarkEdge[] = [
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
  [133, 173], [173, 157], [157, 158], [158, 159], [159, 160], [160, 161], [161, 246], [246, 33],
];

// 4. Official MediaPipe Left Eyebrow
export const FACEMESH_LEFT_EYEBROW: LandmarkEdge[] = [
  [276, 283], [283, 282], [282, 295], [295, 285], [285, 300], [300, 293], [293, 334], [334, 296], [296, 336],
];

// 5. Official MediaPipe Right Eyebrow
export const FACEMESH_RIGHT_EYEBROW: LandmarkEdge[] = [
  [46, 53], [53, 52], [52, 65], [65, 55], [55, 70], [70, 63], [63, 105], [105, 66], [66, 107],
];

// 6. Official MediaPipe Nose Contour (Nasal Ridge, Tip & Nostril Wings)
export const FACEMESH_NOSE: LandmarkEdge[] = [
  // Vertical Nasal Ridge
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1], [1, 19], [19, 94], [94, 2],
  // Nostrils Loop
  [98, 97], [97, 2], [2, 326], [326, 327],
  // Nostril Base Connectors
  [98, 64], [327, 294],
];

// 7. Official MediaPipe Lips Contour (Outer Vermilion Border & Inner Oral Aperture)
export const FACEMESH_LIPS: LandmarkEdge[] = [
  // Outer Lips Loop
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405], [405, 321],
  [321, 375], [375, 291], [291, 409], [409, 270], [270, 269], [269, 267], [267, 0], [0, 37],
  [37, 39], [39, 40], [40, 185], [185, 61],
  // Inner Lips Loop
  [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318],
  [318, 324], [324, 308], [308, 415], [415, 310], [310, 311], [311, 312], [312, 13], [13, 82],
  [82, 81], [81, 80], [80, 191], [191, 78],
];

// Combined list of official contour connections
export const ALL_OFFICIAL_CONTOURS: { name: string; edges: LandmarkEdge[]; color: string; width: number }[] = [
  { name: "Face Outline", edges: FACEMESH_FACE_OVAL, color: "rgba(0, 240, 255, 0.85)", width: 1.6 },
  { name: "Left Eye", edges: FACEMESH_LEFT_EYE, color: "rgba(56, 189, 248, 0.95)", width: 1.8 },
  { name: "Right Eye", edges: FACEMESH_RIGHT_EYE, color: "rgba(56, 189, 248, 0.95)", width: 1.8 },
  { name: "Left Eyebrow", edges: FACEMESH_LEFT_EYEBROW, color: "rgba(34, 211, 238, 0.9)", width: 1.5 },
  { name: "Right Eyebrow", edges: FACEMESH_RIGHT_EYEBROW, color: "rgba(34, 211, 238, 0.9)", width: 1.5 },
  { name: "Nose", edges: FACEMESH_NOSE, color: "rgba(0, 240, 255, 0.85)", width: 1.4 },
  { name: "Lips", edges: FACEMESH_LIPS, color: "rgba(56, 189, 248, 0.95)", width: 1.6 },
];
