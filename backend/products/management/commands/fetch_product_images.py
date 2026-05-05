import os
import urllib.request
import urllib.error
import time

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import Product, ProductImage

# Curated Unsplash photo IDs — actual supplement / nutrition product photos.
# URL format: https://images.unsplash.com/{id}?w=400&h=400&fit=crop&auto=format&q=80
# These short IDs don't need the "photo-" prefix on the CDN.
_P = {
    # protein powder jars / scoops
    'protein_jar_scoop':     'R23MqZKCBcM',
    'protein_vanilla_scoop': 'iYWf4PEd-lI',
    'protein_closeup':       'FQsYjtIPoTM',
    'protein_container':     '4CzpHxVzTFA',
    'protein_hydro':         'RB5aw1rOG3k',
    'protein_choc_scoop':    'MUlIfSNODXE',
    'supplement_stack':      '7lQ1m08Z7eE',
    # pre-workout / creatine powders
    'preworkout_jar_spoon':  '9tyAvsPcDPU',
    'preworkout_jar_scoop':  'VOMRGdga9rc',
    'creatine_scoop':        'S9NchuPb79I',
    # capsules / softgels / tablets
    'capsules_red_brown':    'n-7HTOiJPso',
    'tablets_mixed':         'DRchVK5apjw',
    'softgels_golden':       'L5cWNmqHLb0',
    'gelcaps_yellow':        'przZDqzZKpk',
    'vitamin_bottle':        'kVv8rucgGtc',
}

# Maps each product slug → the photo key from _P above
PRODUCT_PHOTO = {
    # ── Muscle Gain ──────────────────────────────────────────────────────────
    'gold-standard-100-whey':           'protein_jar_scoop',
    'serious-mass-weight-gainer':       'supplement_stack',
    'micronized-creatine-monohydrate':  'creatine_scoop',
    'instantized-bcaa-5000-powder':     'protein_vanilla_scoop',
    'pro-complex-premium-protein':      'protein_closeup',
    'iso100-hydrolyzed-protein':        'protein_hydro',
    'elite-whey-protein':               'protein_container',
    'true-mass-1200-gainer':            'protein_choc_scoop',
    'syntha-6-protein-powder':          'protein_jar_scoop',
    'mass-tech-elite-mass-gainer':      'supplement_stack',
    'nitro-tech-ripped':                'protein_closeup',
    'cellucor-creatine':                'creatine_scoop',
    'now-sports-whey-isolate':          'protein_vanilla_scoop',
    'myprotein-impact-whey':            'protein_container',
    'pure-glutamine-powder':            'preworkout_jar_scoop',
    'scitec-whey-protein-professional': 'protein_hydro',
    # ── Fat Loss ─────────────────────────────────────────────────────────────
    'hydroxycut-hardcore-elite':        'capsules_red_brown',
    'cla-1250-softgels':                'softgels_golden',
    'l-carnitine-liquid-1500':          'gelcaps_yellow',
    'superhd-thermogenic-fat-burner':   'capsules_red_brown',
    'leanmode-stim-free-fat-burner':    'tablets_mixed',
    'green-tea-extract-400mg':          'gelcaps_yellow',
    'mct-oil-powder':                   'preworkout_jar_scoop',
    'transparent-labs-fat-burner':      'capsules_red_brown',
    'shred-matrix-fat-loss':            'tablets_mixed',
    'animal-cuts-complete':             'capsules_red_brown',
    'yohimbine-hcl-2-5mg':             'tablets_mixed',
    'acetyl-l-carnitine-500mg':         'gelcaps_yellow',
    # ── Endurance ────────────────────────────────────────────────────────────
    'beta-alanine-powder':              'preworkout_jar_spoon',
    'skratch-labs-sport-hydration':     'protein_vanilla_scoop',
    'tailwind-endurance-fuel':          'preworkout_jar_scoop',
    'citrulline-malate-powder':         'preworkout_jar_spoon',
    'ucan-superstarch-energy':          'preworkout_jar_scoop',
    'hammer-perpetuem':                 'protein_closeup',
    'precision-hydration-ph-1500':      'protein_vanilla_scoop',
    'maurten-drink-mix-160':            'preworkout_jar_scoop',
    'gu-energy-gel-variety-pack':       'capsules_red_brown',
    'pure-electrolyte-tablets':         'tablets_mixed',
    'first-endurance-efs-liquid-shot':  'softgels_golden',
    'natural-vitality-calm-magnesium':  'gelcaps_yellow',
    # ── General Health ───────────────────────────────────────────────────────
    'opti-men-multivitamin':            'vitamin_bottle',
    'opti-women-multivitamin':          'vitamin_bottle',
    'omega-3-fish-oil-1000mg':          'softgels_golden',
    'vitamin-d3-5000-iu':               'gelcaps_yellow',
    'magnesium-glycinate-400mg':        'tablets_mixed',
    'garden-of-life-raw-probiotic':     'capsules_red_brown',
    'vitamin-c-1000mg-bioflavonoids':   'vitamin_bottle',
    'zinc-picolinate-50mg':             'tablets_mixed',
    'coq10-ubiquinol-100mg':            'softgels_golden',
    'multi-collagen-protein-powder':    'protein_vanilla_scoop',
    'biotin-10000-mcg':                 'gelcaps_yellow',
    'ashwagandha-ksm-66':              'capsules_red_brown',
}


def _unsplash_url(photo_id: str) -> str:
    return (
        f'https://images.unsplash.com/{photo_id}'
        '?w=400&h=400&fit=crop&auto=format&q=80'
    )


class Command(BaseCommand):
    help = 'Download curated Unsplash supplement photos and update DB records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--slug',
            type=str,
            help='Only update this product slug',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-download even if the file already exists',
        )

    def handle(self, *args, **options):
        img_dir = settings.MEDIA_ROOT / 'products'
        os.makedirs(img_dir, exist_ok=True)

        target_slug = options.get('slug')
        force = options.get('force', False)

        mapping = (
            {target_slug: PRODUCT_PHOTO[target_slug]}
            if target_slug and target_slug in PRODUCT_PHOTO
            else PRODUCT_PHOTO
        )

        # Download each unique photo ID once
        downloaded_ids: set[str] = set()

        ok = fail = 0
        for slug, photo_key in mapping.items():
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  skip (no product): {slug}'))
                continue

            photo_id = _P[photo_key]
            filename = f'unsplash_{photo_key}.jpg'
            filepath = img_dir / filename
            rel_path = f'products/{filename}'

            if filepath.exists() and not force:
                self.stdout.write(f'  cached: {slug} → {filename}')
            elif photo_id not in downloaded_ids or force:
                url = _unsplash_url(photo_id)
                if self._download(url, filepath):
                    downloaded_ids.add(photo_id)
                    self.stdout.write(self.style.SUCCESS(f'  downloaded {filename}'))
                else:
                    fail += 1
                    continue
                time.sleep(0.2)

            # Point the primary ProductImage record at the new file
            img_obj = ProductImage.objects.filter(product=product, is_primary=True).first()
            if not img_obj:
                img_obj = ProductImage.objects.filter(product=product).first()
            if img_obj:
                img_obj.image = rel_path
                img_obj.save()
            else:
                ProductImage.objects.create(product=product, image=rel_path, is_primary=True)

            self.stdout.write(self.style.SUCCESS(f'  ✓ {slug}'))
            ok += 1

        self.stdout.write(self.style.SUCCESS(f'\nDone: {ok} updated, {fail} failed'))

    def _download(self, url: str, filepath) -> bool:
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
        }
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
            if len(data) < 5000:
                self.stdout.write(self.style.WARNING(f'  tiny response from {url}'))
                return False
            with open(filepath, 'wb') as f:
                f.write(data)
            return True
        except urllib.error.URLError as e:
            self.stdout.write(self.style.ERROR(f'  failed {url}: {e}'))
            return False
