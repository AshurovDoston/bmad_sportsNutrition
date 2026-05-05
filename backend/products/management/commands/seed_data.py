import hashlib
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw

from content.models import ConfusionEntry
from products.models import GoalCategory, Product, ProductGoalTag, ProductImage, ProductReview

GOALS_DATA = [
    {
        'name': 'Muscle Gain',
        'slug': 'muscle_gain',
        'why_it_works': (
            'Muscle gain products provide the essential protein, amino acids, and calories '
            'needed to support muscle protein synthesis and recovery after intense training. '
            'Higher protein intake combined with resistance exercise stimulates anabolic pathways.'
        ),
    },
    {
        'name': 'Fat Loss',
        'slug': 'fat_loss',
        'why_it_works': (
            'Fat loss supplements support a caloric deficit by boosting metabolism, increasing '
            'fat oxidation, and preserving lean muscle mass. Thermogenic compounds and appetite '
            'management ingredients help maintain adherence to a caloric restriction plan.'
        ),
    },
    {
        'name': 'Endurance',
        'slug': 'endurance',
        'why_it_works': (
            'Endurance supplements delay the onset of fatigue, improve oxygen utilization, '
            'and maintain sustained energy output during prolonged activity. They replenish '
            'electrolytes, glycogen, and buffer lactic acid buildup.'
        ),
    },
    {
        'name': 'General Health',
        'slug': 'general_health',
        'why_it_works': (
            'General health supplements fill nutritional gaps, support immune function, '
            'improve recovery, and maintain overall well-being. A strong health foundation '
            'is the prerequisite for achieving any specific fitness goal effectively.'
        ),
    },
]

PRODUCTS_DATA = [
    # ── MUSCLE GAIN (16 primary) ─────────────────────────────────────────────
    {
        'name': 'Gold Standard 100% Whey',
        'slug': 'gold-standard-100-whey',
        'brand': 'Optimum Nutrition',
        'description': 'The worlds best-selling whey protein powder. Each serving delivers 24g of protein with low fat and carbs to support lean muscle growth and recovery.',
        'price': '29.99',
        'stock_quantity': 150,
        'nutrition_facts': {'serving_size': '33g', 'calories': 120, 'protein_g': 24, 'carbs_g': 3, 'fat_g': 1.5},
        'sort_order': 1,
        'goals': [
            ('muscle_gain', 'Whey protein rapidly delivers amino acids to muscles post-workout, stimulating protein synthesis and supporting hypertrophy.'),
        ],
    },
    {
        'name': 'Serious Mass Weight Gainer',
        'slug': 'serious-mass-weight-gainer',
        'brand': 'Optimum Nutrition',
        'description': 'High-calorie mass gainer with 1,250 calories and 50g protein per serving. Ideal for hard gainers who struggle to consume enough calories for growth.',
        'price': '49.99',
        'stock_quantity': 80,
        'nutrition_facts': {'serving_size': '334g', 'calories': 1250, 'protein_g': 50, 'carbs_g': 254, 'fat_g': 4.5},
        'sort_order': 2,
        'goals': [
            ('muscle_gain', 'Mass gainers provide the surplus calories and protein needed to build mass, especially for ectomorphs with fast metabolisms.'),
        ],
    },
    {
        'name': 'Micronized Creatine Monohydrate',
        'slug': 'micronized-creatine-monohydrate',
        'brand': 'Optimum Nutrition',
        'description': 'Pure micronized creatine monohydrate. Increases muscular strength, power output, and anaerobic capacity. Mixes easily and digests well.',
        'price': '19.99',
        'stock_quantity': 200,
        'nutrition_facts': {'serving_size': '5g', 'calories': 0, 'creatine_g': 5},
        'sort_order': 3,
        'goals': [
            ('muscle_gain', 'Creatine increases phosphocreatine stores, enabling greater training volume and faster strength gains — the most researched muscle-building supplement.'),
            ('endurance', 'Creatine delays muscle fatigue during repeated high-intensity efforts, improving performance in interval training and team sports.'),
        ],
    },
    {
        'name': 'Instantized BCAA 5000 Powder',
        'slug': 'instantized-bcaa-5000-powder',
        'brand': 'Optimum Nutrition',
        'description': 'Branched-chain amino acids in the 2:1:1 ratio. Supports muscle recovery, reduces soreness, and prevents muscle breakdown during training.',
        'price': '24.99',
        'stock_quantity': 120,
        'nutrition_facts': {'serving_size': '8g', 'calories': 20, 'leucine_g': 2.5, 'isoleucine_g': 1.25, 'valine_g': 1.25},
        'sort_order': 4,
        'goals': [
            ('muscle_gain', 'BCAAs, especially leucine, directly activate mTOR — the cellular switch for muscle protein synthesis — reducing breakdown during and after workouts.'),
            ('endurance', 'BCAAs serve as a backup fuel source during prolonged exercise and reduce central fatigue by competing with tryptophan for brain uptake.'),
        ],
    },
    {
        'name': 'Pro Complex Premium Protein',
        'slug': 'pro-complex-premium-protein',
        'brand': 'Optimum Nutrition',
        'description': 'Multi-phase protein blend with whey isolate, egg white, and casein. 60g of protein per serving for extended anabolic support.',
        'price': '59.99',
        'stock_quantity': 60,
        'nutrition_facts': {'serving_size': '100g', 'calories': 360, 'protein_g': 60, 'carbs_g': 6, 'fat_g': 5},
        'sort_order': 5,
        'goals': [
            ('muscle_gain', 'The multi-source protein blend provides both fast-digesting whey for immediate recovery and slow-digesting casein for sustained muscle nourishment.'),
        ],
    },
    {
        'name': 'ISO100 Hydrolyzed Protein',
        'slug': 'iso100-hydrolyzed-protein',
        'brand': 'Dymatize',
        'description': 'Ultra-pure hydrolyzed whey protein isolate with 25g protein and less than 1g carbs per serving. Fastest-absorbing protein on the market.',
        'price': '52.99',
        'stock_quantity': 90,
        'nutrition_facts': {'serving_size': '32g', 'calories': 110, 'protein_g': 25, 'carbs_g': 0.5, 'fat_g': 0.5},
        'sort_order': 6,
        'goals': [
            ('muscle_gain', 'Hydrolyzed whey is pre-digested for the fastest amino acid delivery to muscles, ideal for post-workout when protein synthesis window is open.'),
        ],
    },
    {
        'name': 'Elite Whey Protein',
        'slug': 'elite-whey-protein',
        'brand': 'Dymatize',
        'description': 'Premium whey protein concentrate and isolate blend with 25g protein. Great taste with smooth texture. Third-party tested for purity.',
        'price': '34.99',
        'stock_quantity': 110,
        'nutrition_facts': {'serving_size': '37g', 'calories': 150, 'protein_g': 25, 'carbs_g': 4, 'fat_g': 2.5},
        'sort_order': 7,
        'goals': [
            ('muscle_gain', 'A reliable daily protein source that ensures consistent amino acid intake throughout the day to support ongoing muscle repair and growth.'),
        ],
    },
    {
        'name': 'True-Mass 1200 Gainer',
        'slug': 'true-mass-1200-gainer',
        'brand': 'BSN',
        'description': 'Advanced super mass gainer with 1,200 calories and 50g of protein sourced from multiple protein types including whey, casein, and egg.',
        'price': '54.99',
        'stock_quantity': 45,
        'nutrition_facts': {'serving_size': '333g', 'calories': 1200, 'protein_g': 50, 'carbs_g': 222, 'fat_g': 16},
        'sort_order': 8,
        'goals': [
            ('muscle_gain', 'High-calorie gainers overcome the caloric surplus challenge for skinny athletes, providing the energy and protein needed to build substantial muscle mass.'),
        ],
    },
    {
        'name': 'Syntha-6 Protein Powder',
        'slug': 'syntha-6-protein-powder',
        'brand': 'BSN',
        'description': 'Ultra-premium sustained-release protein with 22g protein from 6 protein sources. Exceptional taste makes hitting daily protein goals enjoyable.',
        'price': '39.99',
        'stock_quantity': 95,
        'nutrition_facts': {'serving_size': '47g', 'calories': 200, 'protein_g': 22, 'carbs_g': 15, 'fat_g': 6},
        'sort_order': 9,
        'goals': [
            ('muscle_gain', 'The multi-protein matrix delivers amino acids over an extended period, supporting muscle protein synthesis for hours rather than just post-workout.'),
        ],
    },
    {
        'name': 'Mass-Tech Elite Mass Gainer',
        'slug': 'mass-tech-elite-mass-gainer',
        'brand': 'MuscleTech',
        'description': 'Engineered for hardgainers. Contains 80g of protein and 1,000 calories with creatine and glutamine included for maximum anabolic response.',
        'price': '64.99',
        'stock_quantity': 35,
        'nutrition_facts': {'serving_size': '340g', 'calories': 1000, 'protein_g': 80, 'carbs_g': 156, 'fat_g': 10},
        'sort_order': 10,
        'goals': [
            ('muscle_gain', 'The combination of massive caloric surplus, 80g protein, and added creatine creates an unmatched environment for rapid muscle mass accumulation.'),
        ],
    },
    {
        'name': 'Nitro-Tech Ripped',
        'slug': 'nitro-tech-ripped',
        'brand': 'MuscleTech',
        'description': 'Dual-purpose protein supplement delivering 30g of whey protein plus scientifically studied weight-loss ingredients in one formula.',
        'price': '44.99',
        'stock_quantity': 70,
        'nutrition_facts': {'serving_size': '51g', 'calories': 160, 'protein_g': 30, 'carbs_g': 5, 'fat_g': 2.5},
        'sort_order': 11,
        'goals': [
            ('muscle_gain', 'High protein content supports muscle preservation and growth while thermogenic ingredients help manage body fat simultaneously.'),
            ('fat_loss', 'Fat-loss ingredients combined with high protein content help preserve lean muscle during a caloric deficit, improving body composition.'),
        ],
    },
    {
        'name': 'Cellucor COR-Performance Creatine',
        'slug': 'cellucor-creatine',
        'brand': 'Cellucor',
        'description': 'Ultra-pure creatine monohydrate with no fillers. Enhances strength, muscle volume, and high-intensity exercise performance.',
        'price': '22.99',
        'stock_quantity': 160,
        'nutrition_facts': {'serving_size': '5g', 'calories': 0, 'creatine_g': 5},
        'sort_order': 12,
        'goals': [
            ('muscle_gain', 'Creatine monohydrate is the most evidence-based supplement for increasing strength and muscle size. Increases intramuscular ATP regeneration.'),
        ],
    },
    {
        'name': 'NOW Sports Whey Protein Isolate',
        'slug': 'now-sports-whey-isolate',
        'brand': 'NOW Sports',
        'description': '25g of pure whey protein isolate per serving with no artificial sweeteners, colors, or flavors. Clean label nutrition for discerning athletes.',
        'price': '34.99',
        'stock_quantity': 100,
        'nutrition_facts': {'serving_size': '33g', 'calories': 110, 'protein_g': 25, 'carbs_g': 1, 'fat_g': 0},
        'sort_order': 13,
        'goals': [
            ('muscle_gain', 'Pure whey isolate provides 25g of fast-absorbing protein with minimal calories, making it the cleanest way to meet daily protein targets.'),
            ('general_health', 'Whey protein supports immune function through immunoglobulins and lactoferrin, while providing all essential amino acids for tissue repair.'),
        ],
    },
    {
        'name': 'Myprotein Impact Whey Protein',
        'slug': 'myprotein-impact-whey',
        'brand': 'Myprotein',
        'description': 'Industry-leading value whey protein with 21g protein per serving. Available in 50+ flavors with excellent macronutrient profile.',
        'price': '27.99',
        'stock_quantity': 130,
        'nutrition_facts': {'serving_size': '30g', 'calories': 103, 'protein_g': 21, 'carbs_g': 3, 'fat_g': 1.9},
        'sort_order': 14,
        'goals': [
            ('muscle_gain', 'High-quality whey protein at exceptional value, making it easy to maintain the daily protein intake required for muscle growth.'),
        ],
    },
    {
        'name': 'Pure Glutamine Powder',
        'slug': 'pure-glutamine-powder',
        'brand': 'BulkSupplements',
        'description': 'Pharmaceutical-grade L-Glutamine. Supports muscle recovery, reduces soreness, and maintains gut health during high training loads.',
        'price': '17.99',
        'stock_quantity': 140,
        'nutrition_facts': {'serving_size': '5g', 'calories': 0, 'glutamine_g': 5},
        'sort_order': 15,
        'goals': [
            ('muscle_gain', 'Glutamine is depleted during intense exercise. Replenishing it reduces muscle breakdown and speeds up recovery between training sessions.'),
            ('endurance', 'Glutamine supports immune function during high training volume and helps replenish glycogen stores, reducing recovery time for endurance athletes.'),
        ],
    },
    {
        'name': 'Scitec 100% Whey Protein Professional',
        'slug': 'scitec-whey-protein-professional',
        'brand': 'Scitec Nutrition',
        'description': 'High-quality European whey protein with digestive enzymes for better absorption. 22g protein per serving with excellent amino acid profile.',
        'price': '32.99',
        'stock_quantity': 85,
        'nutrition_facts': {'serving_size': '30g', 'calories': 110, 'protein_g': 22, 'carbs_g': 2.5, 'fat_g': 1},
        'sort_order': 16,
        'goals': [
            ('muscle_gain', 'Added digestive enzymes improve amino acid absorption rate, ensuring more of the protein is actually utilized for muscle repair and growth.'),
        ],
    },

    # ── FAT LOSS (12 primary) ─────────────────────────────────────────────────
    {
        'name': 'Hydroxycut Hardcore Elite',
        'slug': 'hydroxycut-hardcore-elite',
        'brand': 'Hydroxycut',
        'description': 'One of the most-studied weight loss supplements. Contains caffeine anhydrous and other scientifically researched ingredients for thermogenesis.',
        'price': '34.99',
        'stock_quantity': 100,
        'nutrition_facts': {'serving_size': '2 capsules', 'calories': 5, 'caffeine_mg': 270, 'green_coffee_extract_mg': 400},
        'sort_order': 20,
        'goals': [
            ('fat_loss', 'Thermogenic compounds elevate core temperature and metabolic rate, burning additional calories at rest while caffeine mobilizes stored fatty acids for oxidation.'),
        ],
    },
    {
        'name': 'CLA 1250 Softgels',
        'slug': 'cla-1250-softgels',
        'brand': 'NOW Foods',
        'description': 'Conjugated Linoleic Acid (CLA) derived from safflower oil. Helps reduce body fat, preserve lean muscle mass, and improve body composition.',
        'price': '21.99',
        'stock_quantity': 120,
        'nutrition_facts': {'serving_size': '1 softgel', 'calories': 10, 'cla_mg': 1000},
        'sort_order': 21,
        'goals': [
            ('fat_loss', 'CLA modulates fat cell metabolism, promoting the breakdown of stored triglycerides and reducing fat accumulation, particularly in the abdominal area.'),
        ],
    },
    {
        'name': 'L-Carnitine Liquid 1500',
        'slug': 'l-carnitine-liquid-1500',
        'brand': 'Dymatize',
        'description': 'Ready-to-drink L-Carnitine liquid formula. Transports fatty acids into mitochondria for energy production, supporting fat oxidation during cardio.',
        'price': '19.99',
        'stock_quantity': 90,
        'nutrition_facts': {'serving_size': '15ml', 'calories': 5, 'l_carnitine_mg': 1500},
        'sort_order': 22,
        'goals': [
            ('fat_loss', 'L-Carnitine is the key transporter of long-chain fatty acids into the mitochondria where they are burned for energy, enhancing fat oxidation during exercise.'),
            ('endurance', 'By improving fat utilization for energy, L-Carnitine spares glycogen stores during endurance exercise, extending performance capacity.'),
        ],
    },
    {
        'name': 'SuperHD Thermogenic Fat Burner',
        'slug': 'superhd-thermogenic-fat-burner',
        'brand': 'Cellucor',
        'description': 'Premium thermogenic with a sensory blend providing enhanced focus and energy alongside proven fat-loss ingredients.',
        'price': '36.99',
        'stock_quantity': 75,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 5, 'caffeine_mg': 160},
        'sort_order': 23,
        'goals': [
            ('fat_loss', 'Multi-mechanism fat loss through thermogenesis, appetite suppression, and increased energy expenditure creates a more sustainable caloric deficit.'),
        ],
    },
    {
        'name': 'LeanMode Stim-Free Fat Burner',
        'slug': 'leanmode-stim-free-fat-burner',
        'brand': 'Evlution Nutrition',
        'description': 'Stimulant-free fat loss support with garcinia cambogia, CLA, and green coffee bean. Take at any time without disrupting sleep.',
        'price': '28.99',
        'stock_quantity': 85,
        'nutrition_facts': {'serving_size': '3 capsules', 'calories': 10, 'cla_mg': 1000, 'green_coffee_mg': 500},
        'sort_order': 24,
        'goals': [
            ('fat_loss', 'Stimulant-free formula allows 24/7 metabolic support without the jitter or sleep disruption that can undermine diet adherence and recovery.'),
        ],
    },
    {
        'name': 'Green Tea Extract 400mg',
        'slug': 'green-tea-extract-400mg',
        'brand': 'NOW Foods',
        'description': 'Standardized green tea extract with 45% EGCG. Natural thermogenic and antioxidant that gently supports metabolic rate and fat oxidation.',
        'price': '14.99',
        'stock_quantity': 150,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 0, 'egcg_mg': 180, 'caffeine_mg': 20},
        'sort_order': 25,
        'goals': [
            ('fat_loss', 'EGCG in green tea inhibits enzymes that break down norepinephrine, prolonging the fat-burning signal and increasing metabolic rate by 3-4%.'),
            ('general_health', 'Green tea catechins are powerful antioxidants that reduce oxidative stress, support cardiovascular health, and have anti-inflammatory properties.'),
        ],
    },
    {
        'name': 'MCT Oil Powder',
        'slug': 'mct-oil-powder',
        'brand': 'NOW Sports',
        'description': 'Convenient powder form of MCT oil derived from coconut. Rapidly converts to ketones for quick energy without carb-induced insulin spike.',
        'price': '24.99',
        'stock_quantity': 100,
        'nutrition_facts': {'serving_size': '15g', 'calories': 100, 'total_fat_g': 10, 'mct_g': 10},
        'sort_order': 26,
        'goals': [
            ('fat_loss', 'MCTs bypass normal fat digestion and are rapidly converted to ketones, providing clean energy while promoting ketosis and fat adaptation.'),
            ('endurance', 'MCT-derived ketones provide a readily available fuel source for aerobic exercise, reducing carbohydrate dependence in trained athletes.'),
        ],
    },
    {
        'name': 'Transparent Labs Fat Burner',
        'slug': 'transparent-labs-fat-burner',
        'brand': 'Transparent Labs',
        'description': 'Clean-label fat burner with no artificial additives. Clinically dosed ingredients with full label transparency — no proprietary blends.',
        'price': '49.99',
        'stock_quantity': 60,
        'nutrition_facts': {'serving_size': '2 capsules', 'calories': 5, 'caffeine_mg': 200, 'synephrine_mg': 50},
        'sort_order': 27,
        'goals': [
            ('fat_loss', 'Clinically effective doses of each ingredient ensure the fat-loss benefits seen in research are reproducible, with no underdosed ingredients hiding in a blend.'),
        ],
    },
    {
        'name': 'Shred Matrix 8-Stage Fat Loss System',
        'slug': 'shred-matrix-fat-loss',
        'brand': 'MusclePharm',
        'description': '8-stage fat burning formula addressing metabolism, energy, appetite, and mood for comprehensive weight management support.',
        'price': '32.99',
        'stock_quantity': 70,
        'nutrition_facts': {'serving_size': '2 capsules', 'calories': 10, 'caffeine_mg': 200},
        'sort_order': 28,
        'goals': [
            ('fat_loss', 'Multi-stage approach targets every aspect of fat loss including thermogenesis, appetite control, energy levels, and mood — making adherence to a caloric deficit easier.'),
        ],
    },
    {
        'name': 'Animal Cuts Complete Cutting Stack',
        'slug': 'animal-cuts-complete',
        'brand': 'Universal Nutrition',
        'description': 'Comprehensive cutting stack in convenient packs. Addresses every component of fat loss with thermogenics, diuretics, and metabolic enhancers.',
        'price': '44.99',
        'stock_quantity': 55,
        'nutrition_facts': {'serving_size': '1 pack (9 tablets)', 'calories': 15, 'caffeine_mg': 200},
        'sort_order': 29,
        'goals': [
            ('fat_loss', 'The all-in-one approach eliminates the complexity of stacking multiple products while covering every pathway to effective fat loss in a single daily dose.'),
        ],
    },
    {
        'name': 'Yohimbine HCL 2.5mg',
        'slug': 'yohimbine-hcl-2-5mg',
        'brand': 'BulkSupplements',
        'description': 'Standardized yohimbine hydrochloride. Targets alpha-2 adrenergic receptors in stubborn fat areas like the abdomen and thighs for enhanced fat mobilization.',
        'price': '16.99',
        'stock_quantity': 110,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 0, 'yohimbine_mg': 2.5},
        'sort_order': 30,
        'goals': [
            ('fat_loss', 'Yohimbine blocks alpha-2 receptors in stubborn fat cells, allowing adrenaline to stimulate fat breakdown in areas resistant to normal caloric restriction.'),
        ],
    },
    {
        'name': 'Acetyl L-Carnitine 500mg',
        'slug': 'acetyl-l-carnitine-500mg',
        'brand': 'NOW Foods',
        'description': 'Brain-penetrating form of L-Carnitine with enhanced cognitive benefits alongside fat transport support. Improves mental clarity during caloric restriction.',
        'price': '22.99',
        'stock_quantity': 95,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 0, 'acetyl_l_carnitine_mg': 500},
        'sort_order': 31,
        'goals': [
            ('fat_loss', 'The acetylated form crosses the blood-brain barrier, supporting cognitive function often compromised during caloric deficits while also transporting fatty acids for oxidation.'),
            ('general_health', 'Acetyl L-Carnitine supports mitochondrial function, neuroprotection, and energy metabolism — benefits that extend beyond fat loss into overall cellular health.'),
        ],
    },

    # ── ENDURANCE (12 primary) ────────────────────────────────────────────────
    {
        'name': 'Beta-Alanine Powder',
        'slug': 'beta-alanine-powder',
        'brand': 'NOW Sports',
        'description': 'Pure beta-alanine that increases muscle carnosine levels, buffering lactic acid and delaying the onset of muscle fatigue during high-intensity efforts.',
        'price': '16.99',
        'stock_quantity': 130,
        'nutrition_facts': {'serving_size': '2g', 'calories': 0, 'beta_alanine_g': 2},
        'sort_order': 40,
        'goals': [
            ('endurance', 'Beta-alanine elevates muscle carnosine — the primary intracellular buffer — reducing the burning sensation and fatigue during prolonged high-intensity exercise.'),
        ],
    },
    {
        'name': 'Skratch Labs Sport Hydration Mix',
        'slug': 'skratch-labs-sport-hydration',
        'brand': 'Skratch Labs',
        'description': 'Real fruit electrolyte drink designed by sports dietitians. Clean ingredients with the right sodium concentration for optimal fluid absorption during exercise.',
        'price': '22.99',
        'stock_quantity': 140,
        'nutrition_facts': {'serving_size': '22g', 'calories': 80, 'sodium_mg': 380, 'carbs_g': 21},
        'sort_order': 41,
        'goals': [
            ('endurance', 'Proper electrolyte replacement prevents hyponatremia and dehydration, maintaining plasma volume and muscle function during sweat-inducing endurance activities.'),
        ],
    },
    {
        'name': 'Tailwind Endurance Fuel',
        'slug': 'tailwind-endurance-fuel',
        'brand': 'Tailwind Nutrition',
        'description': 'All-in-one endurance fuel with calories, electrolytes, and hydration in one powder. No gut distress — used by ultra-endurance athletes worldwide.',
        'price': '36.99',
        'stock_quantity': 90,
        'nutrition_facts': {'serving_size': '27g', 'calories': 100, 'sodium_mg': 303, 'carbs_g': 25},
        'sort_order': 42,
        'goals': [
            ('endurance', 'Single-ingredient fueling eliminates the complexity of managing separate carbs, electrolytes, and hydration — critical for athletes who cant afford GI distress mid-race.'),
        ],
    },
    {
        'name': 'Citrulline Malate 2:1 Powder',
        'slug': 'citrulline-malate-powder',
        'brand': 'BulkSupplements',
        'description': 'Pure citrulline malate in the research-validated 2:1 ratio. Increases nitric oxide, improves blood flow, and reduces post-exercise soreness.',
        'price': '21.99',
        'stock_quantity': 120,
        'nutrition_facts': {'serving_size': '8g', 'calories': 0, 'citrulline_g': 5.3, 'malate_g': 2.7},
        'sort_order': 43,
        'goals': [
            ('endurance', 'Citrulline reduces ammonia accumulation during exercise and increases nitric oxide production, improving oxygen delivery to muscles during sustained efforts.'),
            ('muscle_gain', 'Enhanced blood flow from citrulline delivers more nutrients and oxygen to muscle tissue, supporting pumps and nutrient partitioning during resistance training.'),
        ],
    },
    {
        'name': 'UCAN Superstarch Energy Powder',
        'slug': 'ucan-superstarch-energy',
        'brand': 'UCAN',
        'description': 'Patented slow-release carbohydrate that provides steady energy without blood sugar spikes. Ideal for endurance athletes who want to avoid the sugar roller coaster.',
        'price': '44.99',
        'stock_quantity': 65,
        'nutrition_facts': {'serving_size': '35g', 'calories': 110, 'carbs_g': 27, 'sodium_mg': 170},
        'sort_order': 44,
        'goals': [
            ('endurance', 'UCAN\'s unique molecular structure provides a slow, steady glucose release that maintains blood sugar levels for hours without the energy crashes associated with fast carbs.'),
        ],
    },
    {
        'name': 'Hammer Perpetuem Endurance Fuel',
        'slug': 'hammer-perpetuem',
        'brand': 'Hammer Nutrition',
        'description': 'Long-distance endurance fuel with sustained-release maltodextrin, soy protein, and fat for ultra events lasting 3+ hours.',
        'price': '32.99',
        'stock_quantity': 55,
        'nutrition_facts': {'serving_size': '130g', 'calories': 465, 'carbs_g': 70, 'protein_g': 15, 'fat_g': 8},
        'sort_order': 45,
        'goals': [
            ('endurance', 'The carb-protein-fat trifecta in Perpetuem mirrors the bodys multi-substrate energy demand during ultra-long events, providing complete nutritional support for 3+ hour efforts.'),
        ],
    },
    {
        'name': 'Precision Hydration PH 1500 Electrolytes',
        'slug': 'precision-hydration-ph-1500',
        'brand': 'Precision Hydration',
        'description': 'High-sodium electrolyte drink for heavy sweaters. 1,500mg sodium per serving replaces what is lost during intense exercise in hot conditions.',
        'price': '28.99',
        'stock_quantity': 75,
        'nutrition_facts': {'serving_size': '20g', 'calories': 70, 'sodium_mg': 1500, 'potassium_mg': 150},
        'sort_order': 46,
        'goals': [
            ('endurance', 'High-sodium formulation is essential for athletes who lose large amounts of sodium through sweat, preventing the hyponatremia and cramping that derails race performance.'),
        ],
    },
    {
        'name': 'Maurten Drink Mix 160',
        'slug': 'maurten-drink-mix-160',
        'brand': 'Maurten',
        'description': 'Hydrogel sports drink used by elite marathon runners. Transports carbohydrates efficiently through the gut for superior absorption during high-intensity running.',
        'price': '69.99',
        'stock_quantity': 40,
        'nutrition_facts': {'serving_size': '40g', 'calories': 160, 'carbs_g': 40, 'sodium_mg': 500},
        'sort_order': 47,
        'goals': [
            ('endurance', 'Maurten\'s hydrogel technology enables higher carbohydrate intake rates (up to 100g/hour) without gastrointestinal distress — critical for elite marathon pacing.'),
        ],
    },
    {
        'name': 'GU Energy Gel Variety Pack',
        'slug': 'gu-energy-gel-variety-pack',
        'brand': 'GU Energy',
        'description': '24-pack assortment of GU energy gels with 100 calories and 20-23g carbohydrates each. Designed to be consumed every 45-60 minutes during exercise.',
        'price': '26.99',
        'stock_quantity': 100,
        'nutrition_facts': {'serving_size': '32g', 'calories': 100, 'carbs_g': 22, 'sodium_mg': 60, 'caffeine_mg': 20},
        'sort_order': 48,
        'goals': [
            ('endurance', 'Timed gel consumption during exercise maintains blood glucose levels and spares muscle glycogen, directly delaying the onset of fatigue in events over 90 minutes.'),
        ],
    },
    {
        'name': 'PURE Electrolyte Tablets',
        'slug': 'pure-electrolyte-tablets',
        'brand': 'PURE Sports Nutrition',
        'description': 'Effervescent electrolyte tablets with balanced sodium, potassium, and magnesium. Zero calories, convenient for travel and racing.',
        'price': '18.99',
        'stock_quantity': 130,
        'nutrition_facts': {'serving_size': '1 tablet', 'calories': 5, 'sodium_mg': 180, 'potassium_mg': 60, 'magnesium_mg': 50},
        'sort_order': 49,
        'goals': [
            ('endurance', 'Convenient electrolyte replacement prevents the muscle cramping, cognitive decline, and performance loss associated with electrolyte depletion during long events.'),
            ('general_health', 'Maintaining electrolyte balance supports heart rhythm, nerve function, and muscle contractions — fundamental to daily health and active recovery.'),
        ],
    },
    {
        'name': 'First Endurance EFS Liquid Shot',
        'slug': 'first-endurance-efs-liquid-shot',
        'brand': 'First Endurance',
        'description': 'High-calorie liquid shot with complete electrolytes and amino acids. 400mg of sodium and 400 calories in a 5oz flask for ultra events.',
        'price': '49.99',
        'stock_quantity': 45,
        'nutrition_facts': {'serving_size': '148ml', 'calories': 400, 'carbs_g': 100, 'sodium_mg': 400},
        'sort_order': 50,
        'goals': [
            ('endurance', 'High-calorie density in liquid form solves the fueling challenge of consuming enough calories during ultra-distance events where solid food is impractical.'),
        ],
    },
    {
        'name': 'Natural Vitality CALM Magnesium',
        'slug': 'natural-vitality-calm-magnesium',
        'brand': 'Natural Vitality',
        'description': 'Highly bioavailable magnesium citrate powder. Supports muscle relaxation, recovery, and sleep quality — essential for endurance athletes under high training loads.',
        'price': '23.99',
        'stock_quantity': 110,
        'nutrition_facts': {'serving_size': '4g', 'calories': 15, 'magnesium_mg': 325},
        'sort_order': 51,
        'goals': [
            ('endurance', 'Magnesium is critical for over 300 enzymatic reactions including ATP synthesis. Endurance athletes deplete it rapidly through sweat, making supplementation essential.'),
            ('general_health', 'Magnesium supports sleep quality, stress management, and cardiovascular health — core pillars of long-term athletic performance and general wellness.'),
        ],
    },

    # ── GENERAL HEALTH (12 primary) ───────────────────────────────────────────
    {
        'name': 'Opti-Men Multivitamin',
        'slug': 'opti-men-multivitamin',
        'brand': 'Optimum Nutrition',
        'description': 'Complete multivitamin for active men with 75+ ingredients including vitamins, minerals, botanical extracts, and amino acids.',
        'price': '29.99',
        'stock_quantity': 160,
        'nutrition_facts': {'serving_size': '3 tablets', 'calories': 10, 'vitamin_d_iu': 2000, 'vitamin_c_mg': 300},
        'sort_order': 60,
        'goals': [
            ('general_health', 'A comprehensive multivitamin fills nutritional gaps from imperfect diets, ensuring all metabolic pathways have the cofactors they need to function optimally.'),
        ],
    },
    {
        'name': 'Opti-Women Multivitamin',
        'slug': 'opti-women-multivitamin',
        'brand': 'Optimum Nutrition',
        'description': 'Complete multivitamin for active women with 23 vitamins and minerals plus 17 specialty ingredients including iron, folic acid, and cranberry extract.',
        'price': '27.99',
        'stock_quantity': 130,
        'nutrition_facts': {'serving_size': '2 capsules', 'calories': 5, 'iron_mg': 18, 'folic_acid_mcg': 400},
        'sort_order': 61,
        'goals': [
            ('general_health', 'Formulated for active women with higher iron requirements, folate for hormonal health, and nutrients that support bone density maintenance during training.'),
            ('fat_loss', 'Key micronutrients in this formula support thyroid function, energy metabolism, and hormonal balance — all critical for effective fat loss in women.'),
        ],
    },
    {
        'name': 'Omega-3 Fish Oil 1000mg',
        'slug': 'omega-3-fish-oil-1000mg',
        'brand': 'NOW Foods',
        'description': 'High-purity, molecularly distilled fish oil with 180mg EPA and 120mg DHA per softgel. Supports heart health, joint function, and cognitive performance.',
        'price': '19.99',
        'stock_quantity': 200,
        'nutrition_facts': {'serving_size': '1 softgel', 'calories': 10, 'epa_mg': 180, 'dha_mg': 120},
        'sort_order': 62,
        'goals': [
            ('general_health', 'EPA and DHA reduce systemic inflammation, support cardiovascular health, enhance cognitive function, and improve joint mobility — benefits relevant to all health-conscious individuals.'),
            ('muscle_gain', 'Omega-3s improve muscle protein synthesis sensitivity and reduce exercise-induced muscle damage, supporting faster recovery and greater training adaptations.'),
        ],
    },
    {
        'name': 'Vitamin D3 5000 IU',
        'slug': 'vitamin-d3-5000-iu',
        'brand': 'Sports Research',
        'description': 'High-potency Vitamin D3 in cold-pressed coconut oil for superior absorption. Supports bone density, immune function, and hormonal health.',
        'price': '16.99',
        'stock_quantity': 180,
        'nutrition_facts': {'serving_size': '1 softgel', 'calories': 15, 'vitamin_d3_iu': 5000},
        'sort_order': 63,
        'goals': [
            ('general_health', 'Vitamin D deficiency affects over 40% of people. Adequate D3 levels are linked to stronger immunity, improved mood, better sleep, and optimal hormonal function.'),
            ('muscle_gain', 'Vitamin D receptors in muscle tissue regulate protein synthesis and testosterone production — low levels are directly associated with reduced muscle strength and mass.'),
        ],
    },
    {
        'name': 'Magnesium Glycinate 400mg',
        'slug': 'magnesium-glycinate-400mg',
        'brand': "Doctor's Best",
        'description': "Highly bioavailable magnesium glycinate that doesn't cause digestive upset. Supports sleep quality, muscle relaxation, and nervous system function.",
        'price': '24.99',
        'stock_quantity': 150,
        'nutrition_facts': {'serving_size': '2 tablets', 'calories': 10, 'magnesium_mg': 200},
        'sort_order': 64,
        'goals': [
            ('general_health', 'Magnesium glycinate\'s superior bioavailability ensures adequate cellular magnesium for energy production, protein synthesis, and the 300+ enzymatic reactions it cofactors.'),
        ],
    },
    {
        'name': 'Garden of Life Raw Probiotic',
        'slug': 'garden-of-life-raw-probiotic',
        'brand': 'Garden of Life',
        'description': 'Live probiotic supplement with 34 probiotic strains and 85 billion CFU. Supports gut microbiome diversity, immune function, and digestive health.',
        'price': '37.99',
        'stock_quantity': 90,
        'nutrition_facts': {'serving_size': '3 capsules', 'calories': 0, 'probiotics_cfu': '85 billion'},
        'sort_order': 65,
        'goals': [
            ('general_health', 'A diverse gut microbiome is foundational to immunity, nutrient absorption, inflammation control, and even mood regulation — impacting every aspect of health and athletic performance.'),
        ],
    },
    {
        'name': 'Vitamin C 1000mg with Bioflavonoids',
        'slug': 'vitamin-c-1000mg-bioflavonoids',
        'brand': 'NOW Foods',
        'description': 'Time-released Vitamin C with citrus bioflavonoids for enhanced absorption. Potent antioxidant that supports immune function and collagen synthesis.',
        'price': '16.99',
        'stock_quantity': 190,
        'nutrition_facts': {'serving_size': '1 tablet', 'calories': 5, 'vitamin_c_mg': 1000, 'bioflavonoids_mg': 25},
        'sort_order': 66,
        'goals': [
            ('general_health', 'Vitamin C is a cornerstone antioxidant that regenerates other antioxidants, supports immune surveillance, and is required for collagen and carnitine synthesis.'),
            ('endurance', 'Vitamin C reduces oxidative stress from high training loads and supports iron absorption — critical for oxygen-carrying capacity in endurance athletes.'),
        ],
    },
    {
        'name': 'Zinc Picolinate 50mg',
        'slug': 'zinc-picolinate-50mg',
        'brand': 'NOW Foods',
        'description': 'Highly bioavailable zinc picolinate that supports testosterone production, immune function, wound healing, and protein synthesis.',
        'price': '12.99',
        'stock_quantity': 160,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 0, 'zinc_mg': 50},
        'sort_order': 67,
        'goals': [
            ('general_health', 'Zinc is essential for over 200 enzymes, immune cell development, testosterone synthesis, and DNA replication — athletes deplete it faster than sedentary individuals.'),
            ('muscle_gain', 'Zinc supports testosterone synthesis and growth hormone signaling, both anabolic hormones critical for muscle development and strength adaptation.'),
        ],
    },
    {
        'name': 'CoQ10 Ubiquinol 100mg',
        'slug': 'coq10-ubiquinol-100mg',
        'brand': 'Jarrow Formulas',
        'description': 'Active form of CoQ10 (ubiquinol) with superior bioavailability. Supports mitochondrial energy production and cardiovascular health.',
        'price': '42.99',
        'stock_quantity': 75,
        'nutrition_facts': {'serving_size': '1 softgel', 'calories': 10, 'coq10_mg': 100},
        'sort_order': 68,
        'goals': [
            ('general_health', 'CoQ10 is the key cofactor in mitochondrial ATP production. Levels decline with age and statin use — supplementation restores cellular energy capacity and cardiac protection.'),
            ('endurance', 'Enhanced mitochondrial function from CoQ10 improves aerobic energy production and reduces the cellular oxidative damage accumulating during high training volumes.'),
        ],
    },
    {
        'name': 'Multi Collagen Protein Powder',
        'slug': 'multi-collagen-protein-powder',
        'brand': 'Ancient Nutrition',
        'description': 'Type I, II, III, V, and X collagen from 4 food sources. Supports joint health, skin elasticity, gut lining integrity, and connective tissue repair.',
        'price': '47.99',
        'stock_quantity': 65,
        'nutrition_facts': {'serving_size': '11.2g', 'calories': 40, 'protein_g': 9, 'collagen_g': 9},
        'sort_order': 69,
        'goals': [
            ('general_health', 'Multi-type collagen addresses the different structural roles collagen plays in joints, skin, gut, and blood vessels — a whole-body connective tissue support supplement.'),
            ('endurance', 'Collagen synthesis supports tendon and ligament integrity, reducing injury risk in repetitive-motion endurance activities like running and cycling.'),
        ],
    },
    {
        'name': 'Biotin 10000 mcg',
        'slug': 'biotin-10000-mcg',
        'brand': 'Sports Research',
        'description': 'High-potency biotin in organic coconut oil for enhanced absorption. Supports keratin production for healthier hair, skin, and nails.',
        'price': '14.99',
        'stock_quantity': 170,
        'nutrition_facts': {'serving_size': '1 softgel', 'calories': 10, 'biotin_mcg': 10000},
        'sort_order': 70,
        'goals': [
            ('general_health', 'Biotin is essential for fatty acid synthesis, glucose metabolism, and amino acid catabolism. High-dose supplementation supports keratin infrastructure throughout the body.'),
        ],
    },
    {
        'name': 'Ashwagandha KSM-66 Extract',
        'slug': 'ashwagandha-ksm-66',
        'brand': 'NOW Foods',
        'description': 'Full-spectrum ashwagandha root extract standardized to 5% withanolides. Reduces cortisol, supports stress resilience, testosterone, and recovery.',
        'price': '26.99',
        'stock_quantity': 115,
        'nutrition_facts': {'serving_size': '1 capsule', 'calories': 0, 'ashwagandha_mg': 600},
        'sort_order': 71,
        'goals': [
            ('general_health', 'KSM-66 ashwagandha is clinically shown to reduce cortisol by 28%, improve stress resilience, enhance VO2 max, and support testosterone levels in athletes.'),
            ('muscle_gain', 'Ashwagandha supports testosterone production and reduces exercise-induced cortisol spikes, improving the anabolic environment for muscle growth and recovery.'),
        ],
    },
]

REVIEWER_NAMES = [
    'Akbar T.', 'Nodira K.', 'Jasur M.', 'Malika R.', 'Dilshod B.',
    'Zulfiya A.', 'Sanjar O.', 'Feruza I.', 'Bobur N.', 'Gulnora S.',
    'Timur V.', 'Shahlo D.', 'Eldor P.', 'Dilorom F.', 'Ulugbek H.',
]

REVIEW_TEMPLATES = [
    ('Been using this for {months} months and the results speak for themselves. Highly recommend!', 5),
    ('Great product, good value. Noticed improvements within {weeks} weeks of consistent use.', 4),
    ('Quality is excellent and it mixes/absorbs well. Will definitely buy again.', 5),
    ('Solid supplement. Does what it says. No artificial aftertaste.', 4),
    ('This has become a staple in my routine. Can feel the difference in my training.', 5),
    ('Good product overall. Delivery was fast and packaging was secure.', 4),
    ('Tried several brands before settling on this one. Noticeably better results.', 5),
]

CONFUSION_DATA = [
    {
        'question': 'Do I need protein powder if I am just starting out?',
        'answer': (
            'Not necessarily — whole food protein sources like chicken, eggs, and legumes are equally effective. '
            'Protein powder is a convenient supplement, not a requirement. If you struggle to hit 1.6-2.2g of '
            'protein per kg of bodyweight through food alone, a whey protein supplement makes it easier without '
            'extra calories from fat and carbs. Start with food first; use powder to fill gaps.'
        ),
        'goal_slugs': ['muscle_gain'],
        'product_slugs': ['gold-standard-100-whey', 'now-sports-whey-isolate', 'myprotein-impact-whey'],
    },
    {
        'question': 'Is creatine safe and do I need to do a loading phase?',
        'answer': (
            'Creatine monohydrate is one of the most extensively researched supplements in sports science with an '
            'excellent safety profile over long-term use. A loading phase (20g/day for 5-7 days) saturates muscle '
            'creatine stores faster but is optional — taking 3-5g daily for 3-4 weeks achieves the same end result. '
            'Stay hydrated and expect 1-2kg of initial water retention inside the muscles, which is normal.'
        ),
        'goal_slugs': ['muscle_gain', 'endurance'],
        'product_slugs': ['micronized-creatine-monohydrate', 'cellucor-creatine'],
    },
    {
        'question': 'What should I take before a long run or cycling event?',
        'answer': (
            'For events over 60-90 minutes, carbohydrate fueling is essential. Consume a carbohydrate-rich meal '
            '2-3 hours before the event, then use energy gels or sports drinks (20-30g carbs per 30-45 minutes) '
            'during the event. Electrolytes become critical when sweating heavily — sodium is the most important. '
            'For events over 3 hours, consider a fuel source with protein (like Perpetuem) to spare muscle tissue.'
        ),
        'goal_slugs': ['endurance'],
        'product_slugs': ['tailwind-endurance-fuel', 'gu-energy-gel-variety-pack', 'skratch-labs-sport-hydration'],
    },
    {
        'question': 'What vitamins and supplements should everyone take for basic health?',
        'answer': (
            'Most people benefit from: (1) Vitamin D3 — especially if you live in a low-sunlight climate or work '
            'indoors; (2) Omega-3 fish oil — reduces inflammation and supports heart and brain health; (3) Magnesium '
            '— most diets are deficient and it supports sleep, recovery, and hundreds of enzymatic functions. '
            'A comprehensive multivitamin fills remaining gaps. Get blood work done first to identify personal deficiencies.'
        ),
        'goal_slugs': ['general_health'],
        'product_slugs': ['omega-3-fish-oil-1000mg', 'vitamin-d3-5000-iu', 'magnesium-glycinate-400mg'],
    },
    {
        'question': 'Can I lose fat and build muscle at the same time?',
        'answer': (
            'Body recomposition (simultaneous fat loss and muscle gain) is possible, especially for beginners, '
            'those returning from a break, or people with higher body fat percentages. It requires: adequate protein '
            '(2g per kg bodyweight), a slight caloric deficit or maintenance calories, and consistent resistance '
            'training. Progress is slower than dedicated bulk/cut phases but avoids the extremes of each. '
            'Track body composition, not just scale weight.'
        ),
        'goal_slugs': ['muscle_gain', 'fat_loss'],
        'product_slugs': ['nitro-tech-ripped', 'gold-standard-100-whey', 'cla-1250-softgels'],
    },
    {
        'question': 'How do I choose between whey concentrate and whey isolate?',
        'answer': (
            'Whey concentrate (70-80% protein) retains more bioactive compounds like immunoglobulins and growth '
            'factors — great for general muscle building at lower cost. Whey isolate (90%+ protein) has less fat, '
            'lactose, and carbohydrates — better if you are lactose sensitive, in a caloric deficit, or want the '
            'purest protein source. Hydrolyzed isolate is pre-digested for the fastest absorption — ideal immediately '
            'post-workout. For most people, concentrate is excellent value.'
        ),
        'goal_slugs': ['muscle_gain', 'fat_loss'],
        'product_slugs': ['gold-standard-100-whey', 'iso100-hydrolyzed-protein', 'now-sports-whey-isolate'],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with demo sports nutrition data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')
        goals_created = self._seed_goals()
        products_created = self._seed_products()
        reviews_created = self._seed_reviews()
        confusion_created = self._seed_confusion()
        self.stdout.write(self.style.SUCCESS(
            f'\nSeed complete!\n'
            f'  Goal categories: {goals_created} created\n'
            f'  Products: {products_created} created\n'
            f'  Reviews: {reviews_created} created\n'
            f'  Confusion entries: {confusion_created} created\n'
            f'  Total products in DB: {Product.objects.count()}\n'
        ))

    def _seed_goals(self):
        created = 0
        for data in GOALS_DATA:
            _, was_created = GoalCategory.objects.get_or_create(
                slug=data['slug'],
                defaults={'name': data['name'], 'why_it_works': data['why_it_works']}
            )
            if was_created:
                created += 1
        return created

    def _seed_products(self):
        goals = {g.slug: g for g in GoalCategory.objects.all()}
        created = 0
        for data in PRODUCTS_DATA:
            product, was_created = Product.objects.get_or_create(
                slug=data['slug'],
                defaults={
                    'name': data['name'],
                    'brand': data['brand'],
                    'description': data['description'],
                    'price': data['price'],
                    'stock_quantity': data['stock_quantity'],
                    'is_in_stock': True,
                    'nutrition_facts': data['nutrition_facts'],
                    'sort_order': data['sort_order'],
                    'delivery_hours': 2,
                }
            )
            if was_created:
                created += 1
            for goal_slug, why_text in data['goals']:
                goal = goals[goal_slug]
                ProductGoalTag.objects.get_or_create(
                    product=product, goal=goal,
                    defaults={'why_this_works': why_text}
                )
            self._create_placeholder_image_record(product)
            self._create_certificate(product)
        return created

    def _create_placeholder_image_record(self, product):
        rel_path = self._create_placeholder_image(product.slug)
        img_obj, created = ProductImage.objects.get_or_create(
            product=product,
            is_primary=True,
            defaults={'image': rel_path}
        )
        if not created and not img_obj.image:
            img_obj.image = rel_path
            img_obj.save()

    def _create_placeholder_image(self, product_slug):
        h = int(hashlib.md5(product_slug.encode()).hexdigest()[:6], 16)
        r, g, b = (h >> 16) & 0xFF, (h >> 8) & 0xFF, h & 0xFF
        color = (max(r, 80), max(g, 80), max(b, 80))

        img_dir = settings.MEDIA_ROOT / 'products'
        os.makedirs(img_dir, exist_ok=True)
        filename = f'placeholder_{product_slug}.png'
        filepath = img_dir / filename
        if not filepath.exists():
            img = Image.new('RGB', (200, 200), color=color)
            draw = ImageDraw.Draw(img)
            draw.rectangle([10, 10, 189, 189], outline='white', width=3)
            img.save(filepath)
        return f'products/{filename}'

    def _create_certificate(self, product):
        cert_dir = settings.MEDIA_ROOT / 'certificates'
        os.makedirs(cert_dir, exist_ok=True)
        filename = f'cert_{product.slug}.txt'
        filepath = cert_dir / filename
        if not filepath.exists():
            filepath.write_text(
                f'Certificate of Authenticity\n'
                f'Product: {product.name}\n'
                f'Brand: {product.brand}\n'
                f'Issued: 2026-01-01\n'
                f'This product has been verified for authenticity and quality by an accredited laboratory.\n'
            )
        rel_path = f'certificates/{filename}'
        if not product.certificate_file or product.certificate_file.name != rel_path:
            Product.objects.filter(pk=product.pk).update(certificate_file=rel_path)

    def _seed_reviews(self):
        created = 0
        for i, product in enumerate(Product.objects.all()):
            if product.reviews.count() >= 3:
                continue
            for j in range(3):
                name = REVIEWER_NAMES[(i + j) % len(REVIEWER_NAMES)]
                template, rating = REVIEW_TEMPLATES[(i + j) % len(REVIEW_TEMPLATES)]
                text = template.format(months=j + 2, weeks=j + 2)
                _, was_created = ProductReview.objects.get_or_create(
                    product=product,
                    reviewer_name=name,
                    defaults={
                        'rating': rating,
                        'review_text': text,
                        'is_verified': True,
                    }
                )
                if was_created:
                    created += 1
        return created

    def _seed_confusion(self):
        created = 0
        for item in CONFUSION_DATA:
            entry, was_created = ConfusionEntry.objects.get_or_create(
                question=item['question'],
                defaults={'answer': item['answer'], 'is_published': True}
            )
            if was_created:
                created += 1
            products = Product.objects.filter(slug__in=item['product_slugs'])
            entry.recommended_products.set(products)
        return created
