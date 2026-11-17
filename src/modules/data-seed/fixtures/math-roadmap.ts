import type {
  CurriculumSeed,
  SeedSubtask,
  SeedTask,
} from "../domain/types";

const subtask = (
  title: string,
  description: string,
  estimatedMinutes: number,
): SeedSubtask => ({ title, description, estimatedMinutes });

const tasks: SeedTask[] = [
  {
    title: "Whole-number arithmetic mastery",
    description:
      "Learn and master place value and the four basic operations with whole numbers. Understand why standard algorithms work by reasoning about place value.",
    estimatedMinutes: 300,
    priority: "high",
    masteryGate:
      "Accurately solve new multi-digit arithmetic problems; explain carrying and borrowing in your own words; correctly derive the logic behind long division; demonstrate understanding with an unfamiliar representation.",
    resources: [
      "OpenStax Elementary Algebra, Chapter 1",
      "Khan Academy Arithmetic",
    ],
    subtasks: [
      subtask(
        "Place value and large numbers",
        "Review base-10 notation and place values; practice expanding numbers such as 345 = 3×100 + 4×10 + 5.",
        45,
      ),
      subtask(
        "Addition and subtraction",
        "Work through place-value addition and subtraction with carrying and borrowing; explain each step.",
        45,
      ),
      subtask(
        "Multiplication fundamentals",
        "Learn multiplication patterns and then multi-digit multiplication using place-value reasoning.",
        45,
      ),
      subtask(
        "Division fundamentals",
        "Practice long division and explain division as splitting into equal groups.",
        45,
      ),
      subtask(
        "Arithmetic word problems",
        "Solve word problems involving money, counting, and measurement while showing all reasoning.",
        45,
      ),
      subtask(
        "Independent mixed practice",
        "Complete a mixed arithmetic set without notes, check the answers, and log errors.",
        45,
      ),
    ],
  },
  {
    title: "Fractions and decimals mastery",
    description:
      "Understand fractions as parts of wholes and as division. Learn equivalence, operations with unlike denominators, multiplication and division of fractions, and conversion between fractions, decimals, and percentages.",
    estimatedMinutes: 360,
    priority: "high",
    masteryGate:
      "Simplify and operate on fractions correctly; explain why common denominators work; derive fraction division from first principles; convert accurately between fractions, decimals, and percentages and solve related word problems.",
    resources: [
      "OpenStax Elementary Algebra, Chapter 2",
      "Khan Academy Fractions and Decimals",
    ],
    subtasks: [
      subtask(
        "Fraction fundamentals",
        "Visualize fractions, define numerator and denominator, and simplify fractions.",
        45,
      ),
      subtask(
        "Adding and subtracting fractions",
        "Use models to see why common denominators are needed; practice addition and subtraction with unlike denominators.",
        45,
      ),
      subtask(
        "Multiplying and dividing fractions",
        "Explain fractions as division, derive invert-and-multiply with an area model, and practice examples.",
        45,
      ),
      subtask(
        "Decimals and conversion",
        "Convert fractions to decimals through division and decimals to fractions, including decimal addition and subtraction.",
        45,
      ),
      subtask(
        "Percentages and ratios",
        "Convert between percentages and fractions and solve percentage and ratio problems using fraction knowledge.",
        45,
      ),
      subtask(
        "Independent mixed practice",
        "Complete mixed fraction and decimal exercises, check solutions, and review mistakes.",
        45,
      ),
    ],
    taskYard: {
      tldr:
        "Fractions and decimals describe parts of a whole. A fraction a/b means a parts, each of size 1/b; decimals are another notation built on powers of ten. Every operation has a reason: add fractions by making the parts the same size, multiply by scaling both dimensions of a rectangle, and divide by asking how many copies of the divisor fit inside the dividend.",
      notes: [
        {
          title: "Concept map, misconceptions, and worked examples",
          contentHtml: `
            <h2>Core model</h2>
            <p><strong>a/b</strong> means <em>a</em> equal parts of size <em>1/b</em>, and it also means <em>a</em> divided by <em>b</em>.</p>
            <ul>
              <li><strong>Equivalent fractions:</strong> multiplying numerator and denominator by the same nonzero number preserves the proportion, so 1/2 = 2/4 = 50/100.</li>
              <li><strong>Simplifying:</strong> divide numerator and denominator by their greatest common divisor, for example 4/12 = 1/3.</li>
              <li><strong>Adding and subtracting:</strong> first express the values in equal-sized parts. For 1/3 + 1/6, rewrite 1/3 as 2/6 and add to get 3/6 = 1/2.</li>
              <li><strong>Multiplying:</strong> a/b × c/d = (ac)/(bd). The area model shows a rectangle with side lengths a/b and c/d.</li>
              <li><strong>Dividing:</strong> a/b ÷ c/d asks how many copies of c/d fit inside a/b. For 3/4 ÷ 2/5, the result is 3/4 × 5/2 = 15/8.</li>
              <li><strong>Decimals:</strong> decimal places represent tenths, hundredths, thousandths, and so on. Thus 0.75 = 75/100 = 3/4.</li>
              <li><strong>Percentages:</strong> percent means per hundred, so 25% = 25/100 = 1/4.</li>
            </ul>
            <h2>Common misconceptions</h2>
            <ul>
              <li>Adding numerators and denominators separately: 1/2 + 1/3 is not 2/5.</li>
              <li>Treating the decimal point as punctuation instead of a place-value boundary.</li>
              <li>Applying fraction operations without first identifying whether the parts have the same size.</li>
              <li>Confusing a ratio a:b with the fraction b/a.</li>
            </ul>
            <h2>Worked examples</h2>
            <p>3/4 + 5/6 = 9/12 + 10/12 = 19/12.</p>
            <p>2/5 × 3/7 = 6/35.</p>
            <p>0.125 = 125/1000 = 1/8.</p>
          `.trim(),
        },
        {
          title: "Derivation spine",
          contentHtml: `
            <h2>Why common denominators work</h2>
            <p>For a/b + c/d, rewrite both fractions as parts of size 1/(bd): a/b = ad/(bd) and c/d = bc/(bd). Therefore the sum is (ad + bc)/(bd). A b-by-d rectangle makes the equal-sized subdivisions visible.</p>
            <h2>Why division inverts the second fraction</h2>
            <p>Let x = (a/b) ÷ (c/d). By the meaning of division, x · (c/d) = a/b. Multiply both sides by d/c, the reciprocal of c/d, to obtain x = (a/b) · (d/c).</p>
            <h2>Why decimals and percentages convert</h2>
            <p>A terminating decimal records a sum of tenths, hundredths, and so on, so 0.75 = 75/100. A percentage is a fraction with denominator 100, so a% = a/100.</p>
          `.trim(),
        },
      ],
      flashcards: [
        {
          title: "Simplifying fractions",
          front: "Simplify 12/18 and explain the principle.",
          back:
            "Divide numerator and denominator by their greatest common divisor, 6: 12/18 = 2/3. The value is unchanged because both parts are divided by the same nonzero number.",
        },
        {
          title: "Adding unlike fractions",
          front: "How do you add 1/4 + 1/6?",
          back:
            "The least common denominator is 12. Rewrite 1/4 = 3/12 and 1/6 = 2/12, then add: 5/12.",
        },
        {
          title: "Multiplying fractions",
          front: "Compute 3/7 × 14/5 and simplify.",
          back:
            "Cancel 14 and 7 first: 14/7 = 2, so the product is (3 × 2)/5 = 6/5. Direct multiplication gives 42/35, which simplifies to 6/5.",
        },
        {
          title: "Why fraction division works",
          front: "Why does a/b ÷ c/d equal a/b × d/c?",
          back:
            "Let x = (a/b) ÷ (c/d). Then x(c/d) = a/b. Multiplying both sides by d/c gives x = (a/b)(d/c).",
        },
        {
          title: "Decimal to fraction",
          front: "Convert 0.125 to a simplified fraction.",
          back:
            "0.125 has three decimal places, so it is 125/1000. Dividing both parts by 125 gives 1/8.",
        },
        {
          title: "Percentage to fraction",
          front: "Convert 65% to a simplified fraction.",
          back: "65% = 65/100. Divide both parts by 5 to get 13/20.",
        },
        {
          title: "Addition misconception",
          front: "Why is 1/2 + 1/3 not 2/5?",
          back:
            "Fractions can only be added after their parts have the same size. Convert to sixths: 3/6 + 2/6 = 5/6. Adding numerators and denominators separately ignores the denominator's meaning.",
        },
        {
          title: "Whole numbers as fractions",
          front: "Why can the whole number 5 be written as 5/1?",
          back:
            "Five wholes are five parts of size one. Therefore 5 = 5/1, and dividing by 5 is the same as multiplying by its reciprocal 1/5.",
        },
      ],
    },
  },
  {
    title: "Ratios, rates, and proportions",
    description:
      "Master proportional reasoning. Interpret ratios as fractions and connect rates to linear relationships.",
    estimatedMinutes: 180,
    priority: "medium",
    masteryGate:
      "Set up and solve proportional equations in new contexts such as recipes and scale drawings; explain cross-multiplication; correctly interpret a unit rate and use it in an applied problem.",
    resources: [
      "OpenStax Elementary Algebra, Chapter 3",
      "Khan Academy Ratios and Proportions",
    ],
    subtasks: [
      subtask("Understanding ratios", "Set up and simplify ratios from maps, recipes, and comparison problems.", 30),
      subtask("Unit rates and speed", "Calculate and interpret rates such as distance per time and price per item.", 30),
      subtask("Solving proportions", "Derive cross-multiplication and solve numeric and algebraic proportions.", 40),
      subtask("Applied proportion problems", "Solve currency, scaling, and recipe problems while explaining the reasoning.", 40),
      subtask("Concept quiz", "Complete unseen proportion problems without notes, then check and record errors.", 40),
    ],
  },
  {
    title: "Signed numbers and basic equations",
    description:
      "Work confidently with negative numbers and solve simple one-variable equations by reasoning with inverse operations.",
    estimatedMinutes: 240,
    priority: "high",
    masteryGate:
      "Compute expressions with negative integers accurately; explain the sign rule for products; solve equations of the form ax + b = c and justify each inverse-operation step.",
    resources: [
      "OpenStax Elementary Algebra, Chapter 4",
      "Khan Academy Negative Numbers and Basic Algebra",
    ],
    subtasks: [
      subtask("Negative numbers on the number line", "Identify, order, add, and subtract negative integers using a number line.", 40),
      subtask("Rules with negatives", "Practice products and quotients of signed numbers and explain the sign patterns.", 40),
      subtask("Absolute value", "Define absolute value and solve simple equations involving it.", 30),
      subtask("Simple linear equations", "Solve equations such as 2x + 3 = 11 and explain the sequence of inverse operations.", 45),
      subtask("Mixed practice", "Complete mixed signed-number and equation problems and review every error.", 45),
    ],
  },
  {
    title: "Arithmetic laws and factoring",
    description:
      "Solidify the commutative, associative, and distributive laws; factor integers and simple algebraic expressions; derive exponent rules from repeated multiplication.",
    estimatedMinutes: 200,
    priority: "high",
    masteryGate:
      "Factor integers into primes; compute GCD and LCM; expand and factor algebraic expressions using the distributive law; derive exponent rules from repeated multiplication.",
    resources: [
      "OpenStax Elementary Algebra, Chapters 5–6",
      "Khan Academy Arithmetic Laws and Exponents",
    ],
    subtasks: [
      subtask("Prime factorization", "Factor integers using factor trees and express results as products of primes.", 30),
      subtask("GCD and LCM", "Compute greatest common divisors and least common multiples and use them in scheduling problems.", 30),
      subtask("Distributive law", "Use area diagrams to justify and apply expansion and factoring.", 40),
      subtask("Exponent laws", "Derive product and quotient rules from repeated multiplication and simplify expressions.", 30),
      subtask("Mixed factoring practice", "Expand and factor mixed expressions and explain each transformation.", 45),
      subtask("Independent quiz", "Solve unseen laws-and-factoring problems without notes.", 25),
    ],
  },
  {
    title: "Linear equations and functions",
    description:
      "Master solving linear equations and inequalities, graphing lines, interpreting slope, and understanding functions as mappings.",
    estimatedMinutes: 300,
    priority: "high",
    masteryGate:
      "Solve linear equations and inequalities with variables on both sides; graph lines from equations and points; explain slope as a rate; define a function and evaluate it for given inputs.",
    resources: [
      "OpenStax Elementary Algebra, Chapter 7",
      "OpenStax Precalculus, functions introduction",
      "Khan Academy Algebra I",
    ],
    subtasks: [
      subtask("Solving linear equations", "Solve equations with fractions and variables on both sides.", 45),
      subtask("Graphing lines", "Plot lines from y = mx + b and from two points while interpreting rise over run.", 45),
      subtask("Function basics", "Understand function notation, evaluate functions, and distinguish inputs from outputs.", 40),
      subtask("Linear word problems", "Translate verbal relationships into equations and solve them.", 45),
      subtask("Systems introduction", "Solve simple pairs of linear equations and interpret the intersection.", 45),
    ],
  },
  {
    title: "Quadratics and polynomials",
    description:
      "Study quadratic and higher-degree polynomials: factor, solve, graph, and connect completing the square to the structure of a parabola.",
    estimatedMinutes: 360,
    priority: "high",
    masteryGate:
      "Solve quadratics by factoring and by the quadratic formula; derive the formula by completing the square; perform polynomial operations and factor by grouping; explain how vertex form describes a parabola.",
    resources: [
      "OpenStax Precalculus, quadratics and polynomials",
      "Khan Academy Algebra II",
    ],
    subtasks: [
      subtask("Graphing parabolas", "Sketch y = ax², identify direction and vertex, and complete the square in simple examples.", 50),
      subtask("Quadratic factoring", "Factor quadratics such as x² − 5x + 6 and connect factors to zeros.", 45),
      subtask("Derive the quadratic formula", "Complete the square for ax² + bx + c and apply the resulting formula.", 60),
      subtask("Polynomial operations", "Add, subtract, multiply, and factor polynomials by grouping.", 50),
      subtask("Mixed practice", "Solve mixed polynomial and quadratic problems and verify results.", 55),
      subtask("Independent review quiz", "Solve new quadratics by multiple methods with full explanations.", 50),
    ],
  },
  {
    title: "Geometry and analytic geometry",
    description:
      "Connect geometry with algebra by deriving area and distance relationships, computing areas and volumes, and using coordinates to solve geometry problems.",
    estimatedMinutes: 300,
    priority: "medium",
    masteryGate:
      "Calculate areas and volumes; derive the distance formula from the Pythagorean theorem; solve coordinate geometry problems; explain why a triangle's area is half the corresponding rectangle.",
    resources: [
      "OpenStax Precalculus, analytic geometry",
      "Khan Academy Geometry",
    ],
    subtasks: [
      subtask("Area formulas", "Derive triangle area from rectangle area and compute areas from dimensions.", 45),
      subtask("Distance and midpoint", "Derive the distance formula and compute distances and midpoints in the coordinate plane.", 45),
      subtask("Perimeter and volume", "Find perimeters and volumes of common figures and track units.", 45),
      subtask("Analytic geometry", "Interpret line and circle equations graphically.", 45),
      subtask("Applied geometry", "Solve multi-step area, length, and coordinate problems.", 60),
    ],
  },
  {
    title: "Trigonometric functions",
    description:
      "Learn trigonometric ratios in right triangles and on the unit circle, then use identities and graphs to solve problems.",
    estimatedMinutes: 300,
    priority: "medium",
    masteryGate:
      "Compute sine, cosine, and tangent from triangles and angles; derive sin²θ + cos²θ = 1; solve basic trigonometric equations; explain radians and degrees.",
    resources: [
      "OpenStax Precalculus, trigonometry",
      "3Blue1Brown, trigonometry intuition",
    ],
    subtasks: [
      subtask("Right-triangle trigonometry", "Define sine, cosine, and tangent and solve for missing triangle measurements.", 45),
      subtask("The unit circle", "Explain sine and cosine as coordinates; derive the Pythagorean identity.", 45),
      subtask("Sine and cosine graphs", "Sketch periodic graphs and identify period, amplitude, and key points.", 40),
      subtask("Simple identities", "Derive tanθ = sinθ/cosθ and introductory double-angle identities.", 45),
      subtask("Law of sines and cosines", "Use the laws to solve introductory non-right-triangle problems.", 25),
      subtask("Mixed trigonometry practice", "Compute values and verify identities without depending on the calculator.", 60),
    ],
  },
  {
    title: "Precalculus: exponentials, logarithms, and sequences",
    description:
      "Study exponential growth and decay, logarithms as inverses, inverse functions, and arithmetic and geometric sequences before calculus.",
    estimatedMinutes: 240,
    priority: "low",
    masteryGate:
      "Solve equations such as 2^x = 8 and log(x) = y; explain why logarithms invert exponentials; identify arithmetic and geometric sequences and derive the finite geometric sum.",
    resources: [
      "OpenStax Precalculus, exponential and logarithmic functions",
      "Khan Academy Precalculus",
    ],
    subtasks: [
      subtask("Exponential functions", "Graph exponential functions and solve basic exponential equations.", 30),
      subtask("Logarithms", "Define logarithms, convert between exponential and logarithmic form, and solve equations.", 40),
      subtask("Inverse functions", "Inspect inverse tables and graphs and verify composition behavior.", 30),
      subtask("Sequences", "Identify arithmetic and geometric sequences and derive nth-term formulas.", 40),
      subtask("Mixed review", "Complete exponential, logarithmic, and sequence exercises and check errors.", 40),
    ],
  },
  {
    title: "Limits and continuity",
    description:
      "Introduce the limit concept, one-sided behavior, algebraic limit methods, and continuity.",
    estimatedMinutes: 180,
    priority: "high",
    masteryGate:
      "Compute limits by substitution or algebraic simplification; explain limit notation; identify discontinuities and explain why a function value may differ from its limit.",
    resources: [
      "OpenStax Calculus Volume 1, limits",
      "Khan Academy Calculus, limits",
    ],
    subtasks: [
      subtask("Limit intuition", "Explore limits from graphs approaching from the left and right.", 30),
      subtask("Limit rules", "Apply limit laws and evaluate limits by factoring and cancellation.", 40),
      subtask("Continuity", "Define continuity in terms of limits and identify holes, jumps, and asymptotes.", 30),
      subtask("Indeterminate forms", "Resolve a 0/0 limit using algebraic manipulation.", 40),
      subtask("Limit quiz", "Solve five unseen limits and explain every conclusion.", 40),
    ],
  },
  {
    title: "Derivatives",
    description:
      "Define the derivative through the difference quotient and derive the power, sum, product, and quotient rules.",
    estimatedMinutes: 300,
    priority: "high",
    masteryGate:
      "Derive derivatives of powers and constant multiples from the limit definition; compute derivatives of new polynomial functions; explain how each differentiation rule follows from limits.",
    resources: [
      "OpenStax Calculus Volume 1, derivatives",
      "3Blue1Brown, Essence of Calculus",
    ],
    subtasks: [
      subtask("Definition of the derivative", "Apply the difference quotient to x² and x³ and simplify the limiting expression.", 60),
      subtask("Power and basic rules", "Generalize the power rule and verify constants and linear functions.", 45),
      subtask("Sum, product, and quotient rules", "Derive the sum rule and investigate the product and quotient patterns from limits.", 60),
      subtask("Introduction to the chain rule", "Understand composition and the conceptual role of the chain rule.", 30),
      subtask("Independent differentiation", "Differentiate mixed polynomials without a calculator, then check.", 45),
      subtask("Rule reconstruction", "Write a short reconstruction of each differentiation rule from the limit definition.", 60),
    ],
  },
  {
    title: "Tangents, rates, and optimization",
    description:
      "Apply derivatives to tangent lines, motion, critical points, extrema, and optimization.",
    estimatedMinutes: 240,
    priority: "high",
    masteryGate:
      "Write tangent-line equations; solve motion and rate problems; locate critical points and classify extrema; explain why setting f′(x) = 0 identifies flat-slope candidates.",
    resources: [
      "OpenStax Calculus Volume 1, applications of derivatives",
      "Khan Academy Calculus, derivative applications",
    ],
    subtasks: [
      subtask("Tangent lines", "Use the derivative at a point to construct a tangent-line equation.", 45),
      subtask("Motion problems", "Use position, velocity, and acceleration relationships and locate turning points.", 40),
      subtask("Extrema", "Find f′(x) = 0 and classify candidates using sign or second-derivative reasoning.", 45),
      subtask("Optimization", "Solve a constrained geometric optimization problem.", 60),
      subtask("Concept explanation", "Explain in writing why zero slope identifies possible extrema.", 30),
    ],
  },
  {
    title: "Related rates and graph sketching",
    description:
      "Translate changing quantities into related-rate equations and use first and second derivatives to analyze graph shape.",
    estimatedMinutes: 200,
    priority: "medium",
    masteryGate:
      "Build and solve a related-rate model; determine increasing/decreasing intervals, concavity, and inflection from derivatives; produce a derivative-based graph sketch.",
    resources: [
      "OpenStax Calculus Volume 1, related rates and graph analysis",
      "Khan Academy Calculus, related rates",
    ],
    subtasks: [
      subtask("Related-rate setup", "Relate changing quantities and differentiate the relationship implicitly with respect to time.", 45),
      subtask("First and second derivative analysis", "Determine monotonicity, concavity, and inflection from derivative signs.", 40),
      subtask("Related-rate practice", "Solve multiple related-rate problems while tracking units and known rates.", 50),
      subtask("Curve sketching", "Use derivative information to sketch unfamiliar functions.", 50),
      subtask("Inflection explanation", "Explain the connection between a concavity change and f″.", 15),
    ],
  },
  {
    title: "Area and antiderivatives",
    description:
      "Define the definite integral through Riemann sums, develop antiderivatives, and derive the meaning of the Fundamental Theorem of Calculus.",
    estimatedMinutes: 260,
    priority: "high",
    masteryGate:
      "Explain why the integral is computed from an antiderivative; set up Riemann sums for simple functions; compute polynomial definite integrals and bridge accumulation with net change.",
    resources: [
      "OpenStax Calculus Volume 1, integration",
      "3Blue1Brown, calculus intuition",
    ],
    subtasks: [
      subtask("Riemann sums", "Approximate the area under y = x with rectangles and describe the limiting process.", 50),
      subtask("Fundamental Theorem concept", "Explain why F′(x) = f(x) relates accumulation to F(b) − F(a).", 40),
      subtask("Basic antiderivatives", "Use the reverse power rule and verify every result by differentiation.", 45),
      subtask("Definite integrals", "Evaluate polynomial definite integrals and interpret signed area.", 40),
      subtask("Mixed integral practice", "Complete integral and area problems and check results.", 45),
      subtask("Integration reflection", "Write a concise explanation of integration as accumulated change.", 30),
    ],
  },
  {
    title: "Integration applications",
    description:
      "Apply integrals to areas between curves, volumes of revolution, and introductory differential equations.",
    estimatedMinutes: 220,
    priority: "medium",
    masteryGate:
      "Set up and solve area-between-curves and volume-of-revolution integrals; solve introductory separable differential equations by direct integration and use initial conditions.",
    resources: [
      "OpenStax Calculus Volume 2, applications of integration",
      "Khan Academy Calculus, integration applications",
    ],
    subtasks: [
      subtask("Area between curves", "Identify top and bottom functions and integrate their difference.", 45),
      subtask("Volumes of revolution", "Derive the disk-method formula from circular slices and solve an example.", 45),
      subtask("Work and average value", "Interpret force integrated over distance and average value as an integral.", 30),
      subtask("Introductory differential equations", "Solve dy/dx = 3x² and apply an initial condition.", 40),
      subtask("Mixed applications", "Solve combined area and volume problems and verify the setup.", 50),
      subtask("Summary", "Contrast d/dx and ∫dx and explain when each operation is appropriate.", 10),
    ],
  },
  {
    title: "Introduction to series",
    description:
      "Learn sequences and series, derive the geometric-series sum, and develop basic convergence reasoning.",
    estimatedMinutes: 180,
    priority: "low",
    masteryGate:
      "Derive and use the infinite geometric-series formula when |r| < 1; distinguish sequences from series; determine convergence for simple geometric and p-series examples.",
    resources: [
      "OpenStax Calculus Volume 2, sequences and series",
      "Khan Academy Calculus, series",
    ],
    subtasks: [
      subtask("Sequences", "Identify arithmetic and geometric patterns and find nth terms.", 30),
      subtask("Partial sums", "Define a series as the sum of a sequence and write partial sums.", 30),
      subtask("Geometric series", "Derive S = a/(1 − r) for |r| < 1 by manipulating the infinite sum.", 45),
      subtask("Convergence overview", "Distinguish divergent and convergent simple series and introduce the ratio test.", 30),
      subtask("Series practice", "Evaluate geometric series and identify divergence cases.", 45),
    ],
  },
];

export const MATH_ROADMAP_SEED: CurriculumSeed = {
  key: "math-roadmap-v1",
  target: {
    disciplineTitle: "Tool-master",
    projectTitle: "math",
  },
  discipline: {
    title: "Mathematics Foundations to Calculus",
    description:
      "A self-paced journey from arithmetic to single-variable Calculus I-II. It emphasizes conceptual understanding, derivation, problem solving, cumulative review, and mastery checks rather than memorization.",
  },
  project: {
    title: "Mastery of Precalculus and Calculus",
    description:
      "A guided path from arithmetic and fractions through algebra, geometry, trigonometry, precalculus, and Calculus I-II. Each phase includes explicit practice, mastery gates, and connections between core ideas.",
    desiredOutcome:
      "After completion, I can explain and derive key mathematical concepts, solve unfamiliar problems without assistance, identify and correct misconceptions, and apply algebra, precalculus, and single-variable calculus to new situations.",
  },
  tasks,
};
