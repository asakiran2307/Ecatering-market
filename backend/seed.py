"""
Ecatring Seed Script — Populates database with caterers, menu items, images, and users.
Run: python seed.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, execute, query
from auth_helpers import hash_password

# ── Unsplash free CDN image URLs ──────────────────────────────────────────────
# All URLs use images.unsplash.com with no API key required.
# Format: https://images.unsplash.com/photo-{id}?w=800&q=80&auto=format&fit=crop

def img(photo_id, w=800, h=500):
    return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&q=80&auto=format&fit=crop"

def food_img(photo_id, w=600, h=400):
    return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&q=80&auto=format&fit=crop"

# Caterer banner images
CATERER_IMAGES = {
    'spice_garden':   img('1565557623262-b51e2b4be0c7'),   # North Indian feast
    'royal_feast':    img('1414235077428-338989a2e8c0'),   # Elegant buffet
    'fresh_bites':    img('1512621776951-a57ef18b51c'),    # Healthy bowls
    'street_food':    img('1555126634-323283e090fa'),      # Street food
    'gujarat':        img('1596040033229-a7f979b5682a'),   # Indian sweets thali
    'bengal_bay':     img('1585937421612-70a008356fbe'),   # Indian curry
    'punjab_dhaba':   img('1631452180519-a66bc9aa8888'),   # Biryani dum
    'kerala_feast':   img('1567360110757-4a5d7b4d0b74'),   # South Indian
    'rajasthani':     img('1601050690597-df0568f70950'),   # Dal baati
    'coastal_kitchen':img('1504674900247-0877df9cc836'),   # Seafood grill
    'fusion_factory': img('1546069901-ba9599a7e63c'),      # Modern plated
    'mughal_darbar':  img('1599487488170-d11ec9c172f0'),   # Rich Mughlai
    'dessert_palace': img('1551024709-8f23befc548e'),      # Desserts
    'chinese_dragon': img('1563245372-f21724e3856d'),      # Chinese food
    'south_spice':    img('1589302168068-964664d93dc0'),   # South Indian curry
}

# Menu item images (by category)
MENU_IMAGES = {
    # Starters / Appetisers
    'paneer_tikka':    food_img('1567620905732-2d1ec7ab7445'),
    'seekh_kebab':     food_img('1599487488170-d11ec9c172f0'),
    'spring_rolls':    food_img('1563245372-f21724e3856d'),
    'samosa':          food_img('1601050690597-df0568f70950'),
    'bruschetta':      food_img('1546069901-ba9599a7e63c'),
    'chicken_tikka':   food_img('1585937421612-70a008356fbe'),
    'dhokla':          food_img('1596040033229-a7f979b5682a'),
    'vada':            food_img('1589302168068-964664d93dc0'),
    # Main Course
    'butter_chicken':  food_img('1631452180519-a66bc9aa8888'),
    'dal_makhani':     food_img('1565557623262-b51e2b4be0c7'),
    'paneer_masala':   food_img('1585937421612-70a008356fbe'),
    'biryani':         food_img('1631452180519-a66bc9aa8888'),
    'fish_curry':      food_img('1504674900247-0877df9cc836'),
    'rajma':           food_img('1601050690597-df0568f70950'),
    'chole':           food_img('1565557623262-b51e2b4be0c7'),
    'mutton_curry':    food_img('1599487488170-d11ec9c172f0'),
    'pasta':           food_img('1546069901-ba9599a7e63c'),
    'pulao':           food_img('1567360110757-4a5d7b4d0b74'),
    # Rice & Breads
    'naan':            food_img('1585937421612-70a008356fbe'),
    'roti':            food_img('1565557623262-b51e2b4be0c7'),
    'fried_rice':      food_img('1563245372-f21724e3856d'),
    # Desserts
    'gulab_jamun':     food_img('1551024709-8f23befc548e'),
    'rasmalai':        food_img('1596040033229-a7f979b5682a'),
    'kulfi':           food_img('1551024709-8f23befc548e'),
    'kheer':           food_img('1596040033229-a7f979b5682a'),
    'halwa':           food_img('1551024709-8f23befc548e'),
    # Beverages
    'lassi':           food_img('1512621776951-a57ef18b51c'),
    'chai':            food_img('1512621776951-a57ef18b51c'),
    'juice':           food_img('1512621776951-a57ef18b51c'),
}

FALLBACK_IMAGES = {
    'Desserts': food_img('1551024709-8f23befc548e'),
    'Beverages': food_img('1512621776951-a57ef18b51c'),
    'Rice & Breads': food_img('1585937421612-70a008356fbe'),
    'South Indian': food_img('1589302168068-964664d93dc0'),
    'Starters': food_img('1567620905732-2d1ec7ab7445'),
    'Chaat': food_img('1601050690597-df0568f70950'),
    'Healthy Options': food_img('1512621776951-a57ef18b51c'),
    'Continental': food_img('1546069901-ba9599a7e63c'),
    'Asian': food_img('1563245372-f21724e3856d'),
    'Default': food_img('1565557623262-b51e2b4be0c7')
}

def get_item_image(item):
    if item.get('image_url'):
        return item['image_url']
    
    name = item['name'].lower()
    cat = item.get('category', '')

    if 'paneer' in name: return MENU_IMAGES['paneer_masala']
    if 'chicken' in name or 'murg' in name: return MENU_IMAGES['butter_chicken']
    if 'mutton' in name or 'lamb' in name or 'gosht' in name: return MENU_IMAGES['mutton_curry']
    if 'fish' in name or 'prawn' in name or 'seafood' in name or 'hilsa' in name or 'chingri' in name: return MENU_IMAGES['fish_curry']
    if 'biryani' in name: return MENU_IMAGES['biryani']
    if 'dal' in name or 'saag' in name or 'kadai' in name: return MENU_IMAGES['dal_makhani']
    if 'dosa' in name or 'idli' in name or 'vada' in name or 'appam' in name or 'pesarattu' in name: return MENU_IMAGES['vada']
    if 'rice' in name or 'pulao' in name or 'bath' in name: return MENU_IMAGES['pulao']
    if 'naan' in name or 'roti' in name or 'paratha' in name or 'luchi' in name or 'bhature' in name or 'bread' in name: return MENU_IMAGES['naan']
    if 'jamun' in name or 'sweet' in name or 'jalebi' in name or 'sandesh' in name or 'ghevar' in name: return MENU_IMAGES['gulab_jamun']
    if 'halwa' in name or 'kheer' in name or 'rasmalai' in name or 'dessert' in name or 'cake' in name or 'custard' in name or 'firni' in name: return MENU_IMAGES['rasmalai']
    if 'tea' in name or 'chai' in name or 'coffee' in name or 'juice' in name or 'lassi' in name or 'drink' in name or 'beverage' in name or 'punch' in name or 'shorbot' in name or 'water' in name or 'chaas' in name: return MENU_IMAGES['chai']

    return FALLBACK_IMAGES.get(cat, FALLBACK_IMAGES['Default'])


def seed():
    print("Initializing DB...")
    init_db()

    # ── Admin ──────────────────────────────────────────────────────────────────
    existing_admin = query("SELECT id FROM users WHERE email='admin@ecatring.com'", one=True)
    if not existing_admin:
        admin_id = execute(
            "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
            ('Admin', 'admin@ecatring.com', hash_password('admin123'), 'admin')
        )
        print(f"Admin created (id={admin_id})")
    else:
        admin_id = existing_admin['id']
        print("Admin already exists, skipping.")

    # ── Caterers ───────────────────────────────────────────────────────────────
    caterer_data = [
        # 1 - Spice Garden
        {
            'name': 'Priya Sharma', 'email': 'priya@spicegarden.com',
            'business_name': 'Spice Garden Catering',
            'description': 'Authentic Indian cuisine for weddings and corporate events. Masters of North & South Indian thalis, served fresh from our kitchen to your celebration.',
            'cuisine_types': ['North Indian', 'South Indian', 'Street Food'],
            'event_types': ['Wedding', 'Corporate', 'Birthday'],
            'service_area': 'Mumbai, Thane, Navi Mumbai',
            'min_guests': 50, 'max_guests': 2000,
            'base_price_per_person': 650,
            'rating': 4.7, 'review_count': 38,
            'image_url': CATERER_IMAGES['spice_garden'],
            'menu': [
                {'name': 'Paneer Butter Masala', 'category': 'Main Course', 'price': 180, 'unit': 'per plate', 'description': 'Rich creamy tomato-based paneer curry', 'image_url': MENU_IMAGES['paneer_masala']},
                {'name': 'Dal Makhani', 'category': 'Main Course', 'price': 120, 'unit': 'per plate', 'description': 'Slow-cooked black lentils, simmered overnight', 'image_url': MENU_IMAGES['dal_makhani']},
                {'name': 'Butter Chicken', 'category': 'Main Course', 'price': 200, 'unit': 'per plate', 'description': 'Tender chicken in a luscious tomato-cream sauce', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Jeera Rice', 'category': 'Rice & Breads', 'price': 80, 'unit': 'per plate', 'description': 'Basmati rice tempered with cumin', 'image_url': MENU_IMAGES['pulao']},
                {'name': 'Butter Naan', 'category': 'Rice & Breads', 'price': 40, 'unit': 'per piece', 'description': 'Soft leavened bread from tandoor', 'image_url': MENU_IMAGES['naan']},
                {'name': 'Garlic Naan', 'category': 'Rice & Breads', 'price': 50, 'unit': 'per piece', 'description': 'Naan topped with fresh garlic and butter', 'image_url': MENU_IMAGES['naan']},
                {'name': 'Paneer Tikka', 'category': 'Starters', 'price': 160, 'unit': 'per plate', 'description': 'Marinated cottage cheese grilled in tandoor', 'image_url': MENU_IMAGES['paneer_tikka']},
                {'name': 'Veg Samosa (4 pcs)', 'category': 'Starters', 'price': 60, 'unit': 'per plate', 'description': 'Crispy pastry with spiced potato filling', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Gulab Jamun', 'category': 'Desserts', 'price': 60, 'unit': 'per serving', 'description': 'Soft milk-solid balls in rose sugar syrup', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Gajar Halwa', 'category': 'Desserts', 'price': 90, 'unit': 'per serving', 'description': 'Slow-cooked carrot pudding with ghee and nuts', 'image_url': MENU_IMAGES['halwa']},
                {'name': 'Raita', 'category': 'Accompaniments', 'price': 30, 'unit': 'per serving', 'description': 'Chilled yogurt with cucumber and spices'},
                {'name': 'Welcome Drinks (Sharbat)', 'category': 'Beverages', 'price': 50, 'unit': 'per person', 'image_url': MENU_IMAGES['juice']},
                {'name': 'Masala Chai', 'category': 'Beverages', 'price': 30, 'unit': 'per cup', 'description': 'Indian spiced tea with ginger and cardamom', 'image_url': MENU_IMAGES['chai']},
            ]
        },
        # 2 - Royal Feast
        {
            'name': 'Arjun Mehta', 'email': 'arjun@royalfeast.com',
            'business_name': 'Royal Feast Events',
            'description': 'Premium multicuisine catering for high-end weddings and gala dinners. Our executive chefs craft world-class menus that leave a lasting impression.',
            'cuisine_types': ['Continental', 'Chinese', 'North Indian', 'Mughlai'],
            'event_types': ['Wedding', 'Gala Dinner', 'Conference'],
            'service_area': 'Mumbai, Pune',
            'min_guests': 100, 'max_guests': 5000,
            'base_price_per_person': 1200,
            'rating': 4.9, 'review_count': 72,
            'image_url': CATERER_IMAGES['royal_feast'],
            'menu': [
                {'name': 'Lamb Rogan Josh', 'category': 'Main Course', 'price': 380, 'unit': 'per plate', 'description': 'Slow-cooked Kashmiri lamb in aromatic spices', 'image_url': MENU_IMAGES['mutton_curry']},
                {'name': 'Chicken Tikka Masala', 'category': 'Main Course', 'price': 280, 'unit': 'per plate', 'description': 'Chargrilled chicken in spiced tomato cream', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Pasta Arrabiata', 'category': 'Continental', 'price': 220, 'unit': 'per plate', 'description': 'Penne in spicy tomato sauce with fresh herbs', 'image_url': MENU_IMAGES['pasta']},
                {'name': 'Caesar Salad', 'category': 'Starters', 'price': 160, 'unit': 'per plate', 'description': 'Classic Romaine with anchovies, parmesan, croutons'},
                {'name': 'Seekh Kebab', 'category': 'Starters', 'price': 200, 'unit': 'per plate', 'description': 'Minced lamb on skewers, spiced with garam masala', 'image_url': MENU_IMAGES['seekh_kebab']},
                {'name': 'Chicken Tikka (Starter)', 'category': 'Starters', 'price': 220, 'unit': 'per plate', 'description': 'Smoky tandoor-cooked chicken pieces', 'image_url': MENU_IMAGES['chicken_tikka']},
                {'name': 'Veg Biryani (Dum)', 'category': 'Rice & Breads', 'price': 180, 'unit': 'per plate', 'description': 'Saffron rice with seasonal vegetables, dum cooked', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Chicken Biryani', 'category': 'Rice & Breads', 'price': 250, 'unit': 'per plate', 'description': 'Basmati rice layered with spiced chicken, sealed in dough', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Mutton Biryani', 'category': 'Rice & Breads', 'price': 320, 'unit': 'per plate', 'description': 'Slow-cooked tender mutton with fragrant basmati', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Tiramisu', 'category': 'Desserts', 'price': 180, 'unit': 'per serving', 'description': 'Italian coffee-mascarpone dessert'},
                {'name': 'Gulab Jamun', 'category': 'Desserts', 'price': 80, 'unit': 'per serving', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Rasmalai', 'category': 'Desserts', 'price': 120, 'unit': 'per serving', 'description': 'Soft cottage cheese discs in saffron milk', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Fresh Juice Bar', 'category': 'Beverages', 'price': 120, 'unit': 'per person', 'description': 'Seasonal fresh-pressed juices, live counter', 'image_url': MENU_IMAGES['juice']},
                {'name': 'Welcome Mocktails', 'category': 'Beverages', 'price': 90, 'unit': 'per person', 'description': 'Virgin mojito, blue lagoon, fruit punch'},
            ]
        },
        # 3 - Fresh Bites
        {
            'name': 'Sunita Iyer', 'email': 'sunita@freshbites.com',
            'business_name': 'Fresh Bites Catering',
            'description': 'Healthy, fresh, and customized menus for corporate lunches and health-conscious events. We source seasonal ingredients from local farms.',
            'cuisine_types': ['South Indian', 'Healthy', 'Salads'],
            'event_types': ['Corporate', 'Birthday', 'Kitty Party'],
            'service_area': 'Bangalore, Mysore, Mangalore',
            'min_guests': 20, 'max_guests': 300,
            'base_price_per_person': 450,
            'rating': 4.5, 'review_count': 21,
            'image_url': CATERER_IMAGES['fresh_bites'],
            'menu': [
                {'name': 'Idli Sambhar', 'category': 'South Indian', 'price': 80, 'unit': 'per plate', 'description': 'Steamed rice cakes with lentil soup and chutneys', 'image_url': MENU_IMAGES['vada']},
                {'name': 'Masala Dosa', 'category': 'South Indian', 'price': 100, 'unit': 'per plate', 'description': 'Crispy rice crepe with spiced potato filling', 'image_url': MENU_IMAGES['vada']},
                {'name': 'Medu Vada', 'category': 'South Indian', 'price': 60, 'unit': 'per plate', 'description': 'Crispy lentil doughnuts served with coconut chutney', 'image_url': MENU_IMAGES['vada']},
                {'name': 'Chettinad Chicken', 'category': 'Main Course', 'price': 220, 'unit': 'per plate', 'description': 'Fiery Chettinad spiced chicken curry', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Rasam Rice', 'category': 'Main Course', 'price': 90, 'unit': 'per plate', 'description': 'Tamarind pepper rasam with steamed rice'},
                {'name': 'Quinoa Veggie Bowl', 'category': 'Healthy Options', 'price': 180, 'unit': 'per bowl', 'description': 'Protein-packed quinoa with roasted seasonal vegetables', 'image_url': MENU_IMAGES['lassi']},
                {'name': 'Green Detox Salad', 'category': 'Healthy Options', 'price': 150, 'unit': 'per bowl', 'description': 'Kale, spinach, avocado, pumpkin seeds with lemon dressing'},
                {'name': 'Sprout Chaat', 'category': 'Healthy Options', 'price': 100, 'unit': 'per bowl', 'description': 'Mixed sprouts with pomegranate, lemon and spices'},
                {'name': 'Fruit Custard', 'category': 'Desserts', 'price': 70, 'unit': 'per serving', 'description': 'Seasonal fruits in creamy vanilla custard'},
                {'name': 'Filter Coffee', 'category': 'Beverages', 'price': 40, 'unit': 'per cup', 'description': 'South Indian decoction coffee with frothed milk', 'image_url': MENU_IMAGES['chai']},
                {'name': 'Coconut Water', 'category': 'Beverages', 'price': 50, 'unit': 'per glass', 'description': 'Fresh tender coconut water', 'image_url': MENU_IMAGES['juice']},
            ]
        },
        # 4 - Street Food Station
        {
            'name': 'Ravi Khanna', 'email': 'ravi@streetfood.com',
            'business_name': 'Street Food Station',
            'description': 'Authentic street food experience bringing the lanes of Delhi to your party. Live chaat counters, stall setups, and crowd-pleasing snacks that everyone loves.',
            'cuisine_types': ['Street Food', 'Chaat', 'North Indian'],
            'event_types': ['Birthday', 'College Events', 'Food Festival'],
            'service_area': 'Delhi, Noida, Gurugram, Faridabad',
            'min_guests': 30, 'max_guests': 500,
            'base_price_per_person': 350,
            'rating': 4.3, 'review_count': 15,
            'image_url': CATERER_IMAGES['street_food'],
            'menu': [
                {'name': 'Pani Puri Live Counter', 'category': 'Chaat', 'price': 120, 'unit': 'per person', 'description': 'Unlimited pani puri served live by our bhaiyya', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Bhel Puri', 'category': 'Chaat', 'price': 80, 'unit': 'per plate', 'description': 'Puffed rice with tamarind chutney, sev and veggies', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Sev Puri', 'category': 'Chaat', 'price': 90, 'unit': 'per plate', 'description': 'Crispy puri topped with potato, chutneys and sev', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Chole Bhature', 'category': 'Main Course', 'price': 120, 'unit': 'per plate', 'description': 'Spiced chickpea curry with fluffy fried bhature', 'image_url': MENU_IMAGES['chole']},
                {'name': 'Pav Bhaji', 'category': 'Main Course', 'price': 100, 'unit': 'per plate', 'description': 'Spiced mashed vegetable curry with buttered pav', 'image_url': MENU_IMAGES['chole']},
                {'name': 'Vada Pav', 'category': 'Snacks', 'price': 50, 'unit': 'per piece', 'description': 'Mumbai\'s favourite - potato fritter in a bun', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Dahi Vada', 'category': 'Chaat', 'price': 80, 'unit': 'per plate', 'description': 'Soft lentil dumplings in chilled sweetened yogurt'},
                {'name': 'Kulfi Falooda', 'category': 'Desserts', 'price': 90, 'unit': 'per serving', 'description': 'Creamy Indian ice cream with rose falooda', 'image_url': MENU_IMAGES['kulfi']},
                {'name': 'Jalebi', 'category': 'Desserts', 'price': 70, 'unit': 'per plate', 'description': 'Crispy fried spirals soaked in saffron sugar syrup', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Masala Chai', 'category': 'Beverages', 'price': 30, 'unit': 'per cup', 'image_url': MENU_IMAGES['chai']},
                {'name': 'Ganna Juice (Sugarcane)', 'category': 'Beverages', 'price': 50, 'unit': 'per glass', 'description': 'Fresh cold-pressed sugarcane juice', 'image_url': MENU_IMAGES['juice']},
            ]
        },
        # 5 - Gujarat Delights
        {
            'name': 'Meera Patel', 'email': 'meera@gujaratcatering.com',
            'business_name': 'Gujarat Delights',
            'description': 'Traditional Gujarati thali and Jain food specialists. No onion, no garlic options always available. Authentic recipes passed down through generations.',
            'cuisine_types': ['Gujarati', 'Jain', 'Vegetarian'],
            'event_types': ['Wedding', 'Pooja', 'Birthday', 'Corporate'],
            'service_area': 'Ahmedabad, Surat, Vadodara, Rajkot',
            'min_guests': 50, 'max_guests': 3000,
            'base_price_per_person': 550,
            'rating': 4.6, 'review_count': 44,
            'image_url': CATERER_IMAGES['gujarat'],
            'menu': [
                {'name': 'Gujarati Thali (Full)', 'category': 'Main Course', 'price': 380, 'unit': 'per person', 'description': 'Complete thali: dal, sabzi, roti, rice, pickle, papad, chaas, 2 desserts', 'image_url': MENU_IMAGES['pulao']},
                {'name': 'Undhiyu', 'category': 'Main Course', 'price': 150, 'unit': 'per plate', 'description': 'Mixed winter vegetables slow-cooked with spices', 'image_url': MENU_IMAGES['rajma']},
                {'name': 'Patra', 'category': 'Starters', 'price': 80, 'unit': 'per plate', 'description': 'Colocasia leaves rolled with spiced besan paste, steamed and fried'},
                {'name': 'Fafda Jalebi', 'category': 'Starters', 'price': 80, 'unit': 'per plate', 'description': 'Crispy chickpea flour snack with sweet jalebi', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Dhokla', 'category': 'Starters', 'price': 60, 'unit': 'per plate', 'description': 'Steamed fermented chickpea flour snack', 'image_url': MENU_IMAGES['dhokla']},
                {'name': 'Khandvi', 'category': 'Starters', 'price': 70, 'unit': 'per plate', 'description': 'Rolled chickpea and yogurt snack, tempered with mustard'},
                {'name': 'Aam Shrikhand', 'category': 'Desserts', 'price': 90, 'unit': 'per serving', 'description': 'Thick strained yogurt with fresh mango pulp', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Mohanthal', 'category': 'Desserts', 'price': 100, 'unit': 'per serving', 'description': 'Traditional Gujarati besan fudge with saffron and cardamom'},
                {'name': 'Basundi', 'category': 'Desserts', 'price': 80, 'unit': 'per serving', 'description': 'Thickened sweetened milk with dry fruits'},
                {'name': 'Chaas (Buttermilk)', 'category': 'Beverages', 'price': 30, 'unit': 'per glass', 'description': 'Chilled spiced buttermilk, perfect for summer', 'image_url': MENU_IMAGES['lassi']},
                {'name': 'Mango Lassi', 'category': 'Beverages', 'price': 60, 'unit': 'per glass', 'description': 'Thick mango yogurt drink, chilled', 'image_url': MENU_IMAGES['lassi']},
            ]
        },
        # 6 - Bengal Bay Seafood
        {
            'name': 'Debashish Roy', 'email': 'debashish@bengalbay.com',
            'business_name': 'Bengal Bay Catering',
            'description': 'Authentic Bengali and coastal seafood catering. Hilsa fish preparations, prawn malai curry, and traditional mishti doi that remind you of home.',
            'cuisine_types': ['Bengali', 'Seafood', 'South Indian'],
            'event_types': ['Wedding', 'Corporate', 'Birthday', 'Pooja'],
            'service_area': 'Kolkata, Howrah, Salt Lake',
            'min_guests': 40, 'max_guests': 800,
            'base_price_per_person': 700,
            'rating': 4.8, 'review_count': 56,
            'image_url': CATERER_IMAGES['bengal_bay'],
            'menu': [
                {'name': 'Hilsa Fish (Ilish) Curry', 'category': 'Main Course', 'price': 450, 'unit': 'per plate', 'description': 'Classic mustard hilsa fish curry - the pride of Bengal', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Prawn Malai Curry', 'category': 'Main Course', 'price': 380, 'unit': 'per plate', 'description': 'Tiger prawns in coconut milk and mild spices', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Chingri Bhapa', 'category': 'Main Course', 'price': 400, 'unit': 'per plate', 'description': 'Steamed prawns in mustard and poppy seed paste'},
                {'name': 'Kosha Mangsho', 'category': 'Main Course', 'price': 350, 'unit': 'per plate', 'description': 'Slow-cooked spicy mutton curry, Bengali style', 'image_url': MENU_IMAGES['mutton_curry']},
                {'name': 'Begun Bhaja', 'category': 'Starters', 'price': 80, 'unit': 'per plate', 'description': 'Pan-fried spiced eggplant slices'},
                {'name': 'Mochar Chop', 'category': 'Starters', 'price': 100, 'unit': 'per plate', 'description': 'Banana flower cutlets, deep fried with aromatic spices'},
                {'name': 'Steamed Rice', 'category': 'Rice & Breads', 'price': 60, 'unit': 'per plate', 'image_url': MENU_IMAGES['pulao']},
                {'name': 'Luchi (Puri)', 'category': 'Rice & Breads', 'price': 50, 'unit': 'per serving', 'description': 'Soft fried bread, best with kosha mangsho', 'image_url': MENU_IMAGES['roti']},
                {'name': 'Mishti Doi', 'category': 'Desserts', 'price': 80, 'unit': 'per serving', 'description': 'Traditional Bengali sweetened yogurt set in earthen pots', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Rasgulla', 'category': 'Desserts', 'price': 70, 'unit': 'per serving', 'description': 'Spongy cottage cheese balls in sugar syrup', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Sandesh', 'category': 'Desserts', 'price': 90, 'unit': 'per serving', 'description': 'Delicate cottage cheese sweet flavored with rose water'},
                {'name': 'Aam Pora Shorbot', 'category': 'Beverages', 'price': 60, 'unit': 'per glass', 'description': 'Roasted mango drink, a Bengali summer classic', 'image_url': MENU_IMAGES['juice']},
            ]
        },
        # 7 - Punjab Da Dhaba
        {
            'name': 'Harpreet Singh', 'email': 'harpreet@punjabdhaba.com',
            'business_name': 'Punjab Da Dhaba',
            'description': 'Hearty Punjabi food from the heart of the Punjab. Our dhabha-style cooking uses traditional iron kadais and clay ovens for that authentic smoky flavour.',
            'cuisine_types': ['North Indian', 'Punjabi', 'Street Food'],
            'event_types': ['Wedding', 'Corporate', 'Birthday', 'Langar'],
            'service_area': 'Amritsar, Ludhiana, Chandigarh, Delhi',
            'min_guests': 60, 'max_guests': 5000,
            'base_price_per_person': 600,
            'rating': 4.6, 'review_count': 63,
            'image_url': CATERER_IMAGES['punjab_dhaba'],
            'menu': [
                {'name': 'Sarson Da Saag & Makki Roti', 'category': 'Main Course', 'price': 200, 'unit': 'per plate', 'description': 'Mustard greens curry with white butter and cornmeal flatbread', 'image_url': MENU_IMAGES['dal_makhani']},
                {'name': 'Butter Chicken (Murg Makhani)', 'category': 'Main Course', 'price': 280, 'unit': 'per plate', 'description': 'Slow-cooked chicken in buttery tomato sauce, Amritsari style', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Amritsari Dal Tadka', 'category': 'Main Course', 'price': 120, 'unit': 'per plate', 'description': 'Yellow dal tempered in ghee with garlic and red chili', 'image_url': MENU_IMAGES['dal_makhani']},
                {'name': 'Pindi Chole', 'category': 'Main Course', 'price': 150, 'unit': 'per plate', 'description': 'Black chickpeas cooked in dark, dry masala', 'image_url': MENU_IMAGES['chole']},
                {'name': 'Tandoori Chicken (Full)', 'category': 'Starters', 'price': 320, 'unit': 'per plate', 'description': 'Whole chicken marinated in yogurt and spices, clay oven cooked', 'image_url': MENU_IMAGES['chicken_tikka']},
                {'name': 'Amritsari Fish Tikka', 'category': 'Starters', 'price': 250, 'unit': 'per plate', 'description': 'Ajwain-spiced fish in chickpea batter, fried crisp', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Malai Kofta', 'category': 'Main Course', 'price': 180, 'unit': 'per plate', 'description': 'Cottage cheese and potato balls in rich cream gravy'},
                {'name': 'Tandoori Roti', 'category': 'Rice & Breads', 'price': 30, 'unit': 'per piece', 'image_url': MENU_IMAGES['roti']},
                {'name': 'Lachha Paratha', 'category': 'Rice & Breads', 'price': 60, 'unit': 'per piece', 'description': 'Flaky layered wheat flatbread with white butter', 'image_url': MENU_IMAGES['roti']},
                {'name': 'Lassi (Sweet / Salted)', 'category': 'Beverages', 'price': 80, 'unit': 'per glass', 'description': 'Thick blended yogurt drink in tall glasses', 'image_url': MENU_IMAGES['lassi']},
                {'name': 'Kheer', 'category': 'Desserts', 'price': 90, 'unit': 'per serving', 'description': 'Creamy rice pudding with saffron and cardamom', 'image_url': MENU_IMAGES['kheer']},
                {'name': 'Gajrela', 'category': 'Desserts', 'price': 100, 'unit': 'per serving', 'description': 'Punjabi carrot halwa made with desi ghee'},
            ]
        },
        # 8 - Kerala Feast
        {
            'name': 'Suresh Menon', 'email': 'suresh@keralafeast.com',
            'business_name': 'Kerala Feast Catering',
            'description': 'Bringing the essence of God\'s Own Country to your celebration. Authentic Kerala sadya served on banana leaves, fresh coconut-based curries, and Malabar specialties.',
            'cuisine_types': ['South Indian', 'Kerala', 'Seafood'],
            'event_types': ['Wedding', 'Onam Sadya', 'Pooja', 'Birthday'],
            'service_area': 'Kochi, Thiruvananthapuram, Kozhikode, Thrissur',
            'min_guests': 50, 'max_guests': 2000,
            'base_price_per_person': 580,
            'rating': 4.7, 'review_count': 41,
            'image_url': CATERER_IMAGES['kerala_feast'],
            'menu': [
                {'name': 'Kerala Sadya (Full Onam)', 'category': 'Main Course', 'price': 500, 'unit': 'per person', 'description': '26-item feast on banana leaf: sambhar, rasam, avial, 5 curries, 2 payasams', 'image_url': MENU_IMAGES['pulao']},
                {'name': 'Fish Molee', 'category': 'Main Course', 'price': 280, 'unit': 'per plate', 'description': 'Delicate coconut milk fish curry with turmeric', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Prawn Curry (Cheemeen)', 'category': 'Main Course', 'price': 320, 'unit': 'per plate', 'description': 'Prawns cooked in roasted coconut and Kodampuli', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Avial', 'category': 'Accompaniments', 'price': 120, 'unit': 'per plate', 'description': 'Mixed vegetables in coconut and yogurt sauce'},
                {'name': 'Appam', 'category': 'Rice & Breads', 'price': 60, 'unit': 'per 2 pcs', 'description': 'Lacy rice hoppers, crispy edges, soft center', 'image_url': MENU_IMAGES['roti']},
                {'name': 'Pathiri', 'category': 'Rice & Breads', 'price': 50, 'unit': 'per 2 pcs', 'description': 'Thin rice flour flatbread from Malabar'},
                {'name': 'Chicken Stew', 'category': 'Main Course', 'price': 220, 'unit': 'per plate', 'description': 'Kerala-style mild chicken in coconut milk with vegetables', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Ada Pradhaman', 'category': 'Desserts', 'price': 120, 'unit': 'per serving', 'description': 'Rice flakes payasam in coconut milk with jaggery and coconut chips', 'image_url': MENU_IMAGES['kheer']},
                {'name': 'Pal Payasam', 'category': 'Desserts', 'price': 100, 'unit': 'per serving', 'description': 'Slow-cooked milk and rice pudding, temple style', 'image_url': MENU_IMAGES['kheer']},
                {'name': 'Tender Coconut Water', 'category': 'Beverages', 'price': 70, 'unit': 'per glass', 'image_url': MENU_IMAGES['juice']},
                {'name': 'Sulaimani Tea', 'category': 'Beverages', 'price': 40, 'unit': 'per cup', 'description': 'Malabar black tea with lime and spices', 'image_url': MENU_IMAGES['chai']},
            ]
        },
        # 9 - Rajasthani Rasoi
        {
            'name': 'Bhavna Rathore', 'email': 'bhavna@rajasthanirasoi.com',
            'business_name': 'Rajasthani Rasoi',
            'description': 'Royal Rajasthani cuisine for grand celebrations. Authentic Dal Baati Churma, Ghevar, and the rich flavours of the royal kitchens of Rajasthan.',
            'cuisine_types': ['Rajasthani', 'North Indian', 'Vegetarian'],
            'event_types': ['Wedding', 'Birthday', 'Pooja', 'Corporate'],
            'service_area': 'Jaipur, Jodhpur, Udaipur, Delhi',
            'min_guests': 60, 'max_guests': 3000,
            'base_price_per_person': 620,
            'rating': 4.5, 'review_count': 29,
            'image_url': CATERER_IMAGES['rajasthani'],
            'menu': [
                {'name': 'Dal Baati Churma', 'category': 'Main Course', 'price': 280, 'unit': 'per plate', 'description': 'Baked wheat balls with 5-lentil dal and sweet churma', 'image_url': MENU_IMAGES['dal_makhani']},
                {'name': 'Gatte Ki Sabzi', 'category': 'Main Course', 'price': 140, 'unit': 'per plate', 'description': 'Chickpea flour dumplings in spiced yogurt gravy'},
                {'name': 'Ker Sangri', 'category': 'Main Course', 'price': 160, 'unit': 'per plate', 'description': 'Desert beans and dried berries stir-fried in spices'},
                {'name': 'Laal Maas', 'category': 'Main Course', 'price': 350, 'unit': 'per plate', 'description': 'Fiery red mutton curry with Mathania chilies', 'image_url': MENU_IMAGES['mutton_curry']},
                {'name': 'Bajra Roti with Ghee', 'category': 'Rice & Breads', 'price': 50, 'unit': 'per piece', 'description': 'Pearl millet flatbread smeared with pure ghee', 'image_url': MENU_IMAGES['roti']},
                {'name': 'Mohan Maas', 'category': 'Main Course', 'price': 380, 'unit': 'per plate', 'description': 'Royal white mutton curry, slow cooked in milk and cream'},
                {'name': 'Pyaaz Kachori', 'category': 'Starters', 'price': 80, 'unit': 'per plate', 'description': 'Flaky deep-fried pastry stuffed with spiced onion', 'image_url': MENU_IMAGES['samosa']},
                {'name': 'Ghevar', 'category': 'Desserts', 'price': 120, 'unit': 'per serving', 'description': 'Disc-shaped honeycomb sweet soaked in sugar syrup and rabri', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Malpua Rabri', 'category': 'Desserts', 'price': 130, 'unit': 'per serving', 'description': 'Pan-fried sweet pancake served with thick rabri', 'image_url': MENU_IMAGES['halwa']},
                {'name': 'Thandai', 'category': 'Beverages', 'price': 80, 'unit': 'per glass', 'description': 'Chilled milk with saffron, rose, and crushed nuts', 'image_url': MENU_IMAGES['lassi']},
            ]
        },
        # 10 - Coastal Kitchen
        {
            'name': 'Gaurish Naik', 'email': 'gaurish@coastalkitchen.com',
            'business_name': 'Coastal Kitchen Goa',
            'description': 'Authentic Goan and coastal cuisine. Vindaloo, xacuti, sorpotel, and fresh seafood prepared by Goan chefs with locally sourced ingredients and traditional recipes.',
            'cuisine_types': ['Goan', 'Seafood', 'Continental'],
            'event_types': ['Wedding', 'Birthday', 'Corporate', 'Sunset Party'],
            'service_area': 'Panaji, Margao, Mapusa, Goa',
            'min_guests': 30, 'max_guests': 600,
            'base_price_per_person': 850,
            'rating': 4.6, 'review_count': 32,
            'image_url': CATERER_IMAGES['coastal_kitchen'],
            'menu': [
                {'name': 'Goan Fish Curry & Rice', 'category': 'Main Course', 'price': 300, 'unit': 'per plate', 'description': 'Red coconut curry with kingfish, served with steamed rice', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Prawn Xacuti', 'category': 'Main Course', 'price': 380, 'unit': 'per plate', 'description': 'Prawns in a complex roasted coconut and spice gravy', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Chicken Vindaloo', 'category': 'Main Course', 'price': 280, 'unit': 'per plate', 'description': 'Fiery marinated chicken in vinegar and chili', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Pork Sorpotel', 'category': 'Main Course', 'price': 320, 'unit': 'per plate', 'description': 'Goan pork and liver stew in tangy spiced sauce'},
                {'name': 'Sol Kadhi', 'category': 'Beverages', 'price': 70, 'unit': 'per glass', 'description': 'Kokum and coconut milk digestive drink', 'image_url': MENU_IMAGES['juice']},
                {'name': 'Grilled Tiger Prawns', 'category': 'Starters', 'price': 450, 'unit': 'per plate', 'description': 'Giant tiger prawns marinated in recheado masala, grilled', 'image_url': MENU_IMAGES['seekh_kebab']},
                {'name': 'Bebinca', 'category': 'Desserts', 'price': 150, 'unit': 'per serving', 'description': 'Goa\'s queen of desserts - 16 layer coconut egg pudding'},
                {'name': 'Dodol', 'category': 'Desserts', 'price': 100, 'unit': 'per serving', 'description': 'Jaggery, coconut, and rice flour traditional sweet'},
                {'name': 'Fresh Fruit Punch', 'category': 'Beverages', 'price': 90, 'unit': 'per person', 'image_url': MENU_IMAGES['juice']},
            ]
        },
        # 11 - Fusion Factory
        {
            'name': 'Natasha D\'Souza', 'email': 'natasha@fusionfactory.com',
            'business_name': 'Fusion Factory',
            'description': 'Where Indian traditions meet global cuisines. Contemporary fusion menus designed for millennials who love their heritage but crave new flavours.',
            'cuisine_types': ['Continental', 'North Indian', 'Chinese', 'Healthy'],
            'event_types': ['Corporate', 'Birthday', 'Conference', 'Social Gathering'],
            'service_area': 'Mumbai, Bangalore, Hyderabad',
            'min_guests': 25, 'max_guests': 500,
            'base_price_per_person': 950,
            'rating': 4.4, 'review_count': 18,
            'image_url': CATERER_IMAGES['fusion_factory'],
            'menu': [
                {'name': 'Butter Chicken Pizza', 'category': 'Fusion Mains', 'price': 280, 'unit': 'per plate', 'description': 'Thin crust pizza topped with butter chicken and mozzarella', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Tandoori Tacos', 'category': 'Fusion Mains', 'price': 220, 'unit': 'per plate', 'description': 'Soft tacos filled with tandoori chicken, onion raita, mint chutney', 'image_url': MENU_IMAGES['chicken_tikka']},
                {'name': 'Paneer Tikka Quesadilla', 'category': 'Fusion Mains', 'price': 200, 'unit': 'per plate', 'description': 'Crispy quesadilla with paneer tikka and green chutney', 'image_url': MENU_IMAGES['paneer_tikka']},
                {'name': 'Masala Pasta', 'category': 'Continental', 'price': 200, 'unit': 'per plate', 'description': 'Penne in Indian-style spiced tomato sauce', 'image_url': MENU_IMAGES['pasta']},
                {'name': 'Sushi Rolls (Veg)', 'category': 'Asian', 'price': 300, 'unit': 'per plate', 'description': 'Cucumber, avocado and cream cheese sushi rolls', 'image_url': MENU_IMAGES['spring_rolls']},
                {'name': 'Dim Sum Basket', 'category': 'Asian', 'price': 260, 'unit': 'per basket', 'description': 'Steamed dumplings: prawn har gao, veg shumai, char siu bao', 'image_url': MENU_IMAGES['spring_rolls']},
                {'name': 'Gulab Jamun Cheesecake', 'category': 'Desserts', 'price': 200, 'unit': 'per serving', 'description': 'Creamy cheesecake base topped with mini gulab jamuns', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Paan Ice Cream', 'category': 'Desserts', 'price': 150, 'unit': 'per scoop', 'description': 'Betel leaf flavored ice cream, uniquely Indian', 'image_url': MENU_IMAGES['kulfi']},
                {'name': 'Cold Brew Coffee', 'category': 'Beverages', 'price': 120, 'unit': 'per glass', 'image_url': MENU_IMAGES['chai']},
                {'name': 'Kombucha Mocktail', 'category': 'Beverages', 'price': 150, 'unit': 'per glass', 'description': 'Probiotic kombucha with seasonal fruit garnish', 'image_url': MENU_IMAGES['juice']},
            ]
        },
        # 12 - Mughal Darbar
        {
            'name': 'Farhan Qureshi', 'email': 'farhan@mughaldarbar.com',
            'business_name': 'Mughal Darbar Catering',
            'description': 'Reviving the lost recipes of the royal Mughal kitchens. Our ustaads cook dum biryani sealed in dough, shami kebabs from 400-year-old recipes, and aromatic kormas.',
            'cuisine_types': ['Mughlai', 'North Indian'],
            'event_types': ['Wedding', 'Gala Dinner', 'Birthday', 'Corporate'],
            'service_area': 'Delhi, Agra, Lucknow, Hyderabad',
            'min_guests': 80, 'max_guests': 3000,
            'base_price_per_person': 800,
            'rating': 4.8, 'review_count': 91,
            'image_url': CATERER_IMAGES['mughal_darbar'],
            'menu': [
                {'name': 'Chicken Dum Biryani (Sealed Handi)', 'category': 'Rice & Breads', 'price': 350, 'unit': 'per plate', 'description': 'Saffron-infused long-grain rice sealed and slow-cooked with chicken', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Mutton Dum Biryani', 'category': 'Rice & Breads', 'price': 420, 'unit': 'per plate', 'description': 'Awadhi style mutton biryani, cooked in traditional clay pot', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Murgh Shahi Korma', 'category': 'Main Course', 'price': 320, 'unit': 'per plate', 'description': 'Chicken in rich almond-cashew-cream sauce with saffron', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Nihari (Slow-Cooked Mutton)', 'category': 'Main Course', 'price': 420, 'unit': 'per plate', 'description': '8-hour slow-cooked mutton shank stew, best with naan', 'image_url': MENU_IMAGES['mutton_curry']},
                {'name': 'Galouti Kebab', 'category': 'Starters', 'price': 300, 'unit': 'per plate', 'description': 'Melt-in-mouth minced lamb kebabs with 150 spices, Lucknow style', 'image_url': MENU_IMAGES['seekh_kebab']},
                {'name': 'Shami Kebab', 'category': 'Starters', 'price': 260, 'unit': 'per plate', 'description': 'Silky minced mutton and chana dal patties', 'image_url': MENU_IMAGES['seekh_kebab']},
                {'name': 'Seekh Kebab (Gilafi)', 'category': 'Starters', 'price': 280, 'unit': 'per plate', 'description': 'Minced lamb kebabs wrapped in onion and pepper', 'image_url': MENU_IMAGES['seekh_kebab']},
                {'name': 'Sheermal', 'category': 'Rice & Breads', 'price': 80, 'unit': 'per piece', 'description': 'Saffron-infused sweet leavened flatbread', 'image_url': MENU_IMAGES['naan']},
                {'name': 'Shahi Tukda', 'category': 'Desserts', 'price': 160, 'unit': 'per serving', 'description': 'Fried bread soaked in sugar syrup, topped with saffron rabri', 'image_url': MENU_IMAGES['halwa']},
                {'name': 'Firni', 'category': 'Desserts', 'price': 140, 'unit': 'per serving', 'description': 'Ground rice and milk pudding set in earthen pots', 'image_url': MENU_IMAGES['kheer']},
                {'name': 'Kehwa', 'category': 'Beverages', 'price': 80, 'unit': 'per cup', 'description': 'Kashmiri saffron-almond green tea', 'image_url': MENU_IMAGES['chai']},
            ]
        },
        # 13 - Dessert Palace
        {
            'name': 'Preethi Rao', 'email': 'preethi@dessertpalace.com',
            'business_name': 'Dessert Palace',
            'description': 'India\'s most loved dessert caterer. We set up stunning dessert tables with traditional Indian sweets, modern patisserie, and live dessert counters at your event.',
            'cuisine_types': ['Desserts', 'Vegetarian', 'Jain'],
            'event_types': ['Wedding', 'Birthday', 'Pooja', 'Kitty Party', 'Anniversary'],
            'service_area': 'Hyderabad, Chennai, Bangalore, Pune',
            'min_guests': 20, 'max_guests': 2000,
            'base_price_per_person': 400,
            'rating': 4.9, 'review_count': 108,
            'image_url': CATERER_IMAGES['dessert_palace'],
            'menu': [
                {'name': 'Gulab Jamun Shots', 'category': 'Indian Sweets', 'price': 80, 'unit': 'per serving (3 pcs)', 'description': 'Mini gulab jamuns served in glass shot cups', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Rasmalai (Premium Saffron)', 'category': 'Indian Sweets', 'price': 120, 'unit': 'per serving', 'description': 'Saffron-infused paneer discs in thick reduced milk', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Kaju Katli', 'category': 'Indian Sweets', 'price': 200, 'unit': 'per 200g', 'description': 'Premium cashew fudge with silver vark', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Moong Dal Halwa', 'category': 'Indian Sweets', 'price': 130, 'unit': 'per serving', 'description': 'Slow-cooked split moong dal with ghee and dry fruits', 'image_url': MENU_IMAGES['halwa']},
                {'name': 'Live Jalebi Counter', 'category': 'Live Counters', 'price': 150, 'unit': 'per person (unlimited)', 'description': 'Fresh hot jalebis cooked live, served with rabri', 'image_url': MENU_IMAGES['gulab_jamun']},
                {'name': 'Kulfi on Stick (3 Flavours)', 'category': 'Frozen Desserts', 'price': 100, 'unit': 'per stick', 'description': 'Malai, Pista, and Kesar kulfi on traditional sticks', 'image_url': MENU_IMAGES['kulfi']},
                {'name': 'Chocolate Fountain', 'category': 'Live Counters', 'price': 250, 'unit': 'per person', 'description': 'Dark chocolate fountain with fruits, marshmallows, and cookies'},
                {'name': 'Barfi Platter (Mixed)', 'category': 'Indian Sweets', 'price': 300, 'unit': 'per kg', 'description': 'Assorted barfis: coconut, chocolate, besan, milk', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'French Macarons (Box of 12)', 'category': 'Patisserie', 'price': 350, 'unit': 'per box', 'description': 'Delicate French macarons in 6 flavours'},
                {'name': 'Custom Cake (3-Tier)', 'category': 'Cakes', 'price': 2500, 'unit': 'per event', 'description': 'Custom designed fondant cake for 80-100 servings'},
                {'name': 'Shrikhand Shots', 'category': 'Indian Sweets', 'price': 90, 'unit': 'per serving', 'description': 'Strained sweetened yogurt in 3 flavours', 'image_url': MENU_IMAGES['rasmalai']},
            ]
        },
        # 14 - Chinese Dragon
        {
            'name': 'Tony Chen', 'email': 'tony@chinesedragon.com',
            'business_name': 'Chinese Dragon Catering',
            'description': 'Authentic Indo-Chinese and Pan-Asian catering for all occasions. From Hakka noodles to Schezwan fried rice, we bring the best of Asian cuisines to your table.',
            'cuisine_types': ['Chinese', 'Asian', 'Continental'],
            'event_types': ['Corporate', 'Birthday', 'Food Festival', 'College Events'],
            'service_area': 'Mumbai, Delhi, Chennai, Kolkata',
            'min_guests': 30, 'max_guests': 800,
            'base_price_per_person': 550,
            'rating': 4.2, 'review_count': 27,
            'image_url': CATERER_IMAGES['chinese_dragon'],
            'menu': [
                {'name': 'Hakka Noodles (Veg / Chicken)', 'category': 'Mains', 'price': 160, 'unit': 'per plate', 'description': 'Stir-fried noodles with vegetables and soy sauce', 'image_url': MENU_IMAGES['fried_rice']},
                {'name': 'Schezwan Fried Rice', 'category': 'Mains', 'price': 180, 'unit': 'per plate', 'description': 'Spicy fried rice with Schezwan sauce and vegetables', 'image_url': MENU_IMAGES['fried_rice']},
                {'name': 'Chicken Manchurian (Dry / Gravy)', 'category': 'Mains', 'price': 220, 'unit': 'per plate', 'description': 'Indo-Chinese fried chicken balls in Manchurian sauce', 'image_url': MENU_IMAGES['butter_chicken']},
                {'name': 'Chilli Paneer', 'category': 'Mains', 'price': 200, 'unit': 'per plate', 'description': 'Crispy paneer tossed in Indo-Chinese sauce with capsicum', 'image_url': MENU_IMAGES['paneer_masala']},
                {'name': 'Dim Sum Platter', 'category': 'Starters', 'price': 280, 'unit': 'per plate', 'description': '12-piece assorted dumplings: prawn, chicken, veg', 'image_url': MENU_IMAGES['spring_rolls']},
                {'name': 'Spring Rolls (6 pcs)', 'category': 'Starters', 'price': 160, 'unit': 'per plate', 'description': 'Crispy fried rolls with glass noodle and vegetable filling', 'image_url': MENU_IMAGES['spring_rolls']},
                {'name': 'Hot & Sour Soup', 'category': 'Starters', 'price': 120, 'unit': 'per bowl', 'description': 'Classic Chinese soup with mushrooms and tofu'},
                {'name': 'Wonton Soup', 'category': 'Starters', 'price': 140, 'unit': 'per bowl', 'description': 'Delicate wontons in clear chicken broth'},
                {'name': 'Sticky Toffee Banana', 'category': 'Desserts', 'price': 130, 'unit': 'per serving', 'description': 'Crispy battered banana in toffee sauce with ice cream'},
                {'name': 'Lychee Mocktail', 'category': 'Beverages', 'price': 120, 'unit': 'per glass', 'description': 'Fresh lychee with sparkling water and rose syrup', 'image_url': MENU_IMAGES['juice']},
                {'name': 'Jasmine Green Tea', 'category': 'Beverages', 'price': 80, 'unit': 'per pot', 'image_url': MENU_IMAGES['chai']},
            ]
        },
        # 15 - South Spice Catering
        {
            'name': 'Lakshmi Krishnan', 'email': 'lakshmi@southspice.com',
            'business_name': 'South Spice Catering',
            'description': 'Complete South Indian catering across all four southern states. Andhra, Tamil, Karnataka, and Telangana specialties handled by experienced regional chefs.',
            'cuisine_types': ['South Indian', 'Andhra', 'Tamil', 'Vegetarian'],
            'event_types': ['Wedding', 'Corporate', 'Pooja', 'Birthday', 'Conference'],
            'service_area': 'Hyderabad, Chennai, Coimbatore, Vizag',
            'min_guests': 40, 'max_guests': 2500,
            'base_price_per_person': 520,
            'rating': 4.6, 'review_count': 49,
            'image_url': CATERER_IMAGES['south_spice'],
            'menu': [
                {'name': 'Andhra Chicken Biryani', 'category': 'Rice & Breads', 'price': 280, 'unit': 'per plate', 'description': 'Spicy Andhra-style chicken biryani with raita and mirchi ka salan', 'image_url': MENU_IMAGES['biryani']},
                {'name': 'Pesarattu', 'category': 'South Indian', 'price': 90, 'unit': 'per plate', 'description': 'Moong dal crepe served with ginger chutney and upma', 'image_url': MENU_IMAGES['vada']},
                {'name': 'Nellore Fish Curry', 'category': 'Main Course', 'price': 320, 'unit': 'per plate', 'description': 'Tangy tamarind-based fiery fish curry from Nellore', 'image_url': MENU_IMAGES['fish_curry']},
                {'name': 'Chettinad Mutton Pepper Fry', 'category': 'Main Course', 'price': 380, 'unit': 'per plate', 'description': 'Dry mutton with fresh black pepper and Chettinad spices', 'image_url': MENU_IMAGES['mutton_curry']},
                {'name': 'Bisi Bele Bath', 'category': 'Main Course', 'price': 120, 'unit': 'per plate', 'description': 'Karnataka\'s comfort food - spiced rice, lentils and vegetables', 'image_url': MENU_IMAGES['pulao']},
                {'name': 'Pulihora (Tamarind Rice)', 'category': 'Main Course', 'price': 100, 'unit': 'per plate', 'description': 'Andhra-style tamarind rice with peanuts and curry leaves'},
                {'name': 'Medu Vada (3 pcs)', 'category': 'Starters', 'price': 70, 'unit': 'per plate', 'image_url': MENU_IMAGES['vada']},
                {'name': 'Rava Dosa (Set of 2)', 'category': 'South Indian', 'price': 120, 'unit': 'per plate', 'description': 'Crispy semolina crepes with onion and green chilli'},
                {'name': 'Double Ka Meetha', 'category': 'Desserts', 'price': 120, 'unit': 'per serving', 'description': 'Hyderabadi bread pudding with saffron, dry fruits and cream', 'image_url': MENU_IMAGES['halwa']},
                {'name': 'Qubani Ka Meetha', 'category': 'Desserts', 'price': 130, 'unit': 'per serving', 'description': 'Hyderabadi apricot dessert with fresh cream', 'image_url': MENU_IMAGES['rasmalai']},
                {'name': 'Filter Coffee Decoction (Live Counter)', 'category': 'Beverages', 'price': 60, 'unit': 'per cup', 'image_url': MENU_IMAGES['chai']},
                {'name': 'Buttermilk (Majjiga)', 'category': 'Beverages', 'price': 40, 'unit': 'per glass', 'description': 'Andhra-style spiced buttermilk with curry leaves', 'image_url': MENU_IMAGES['lassi']},
            ]
        },
    ]

    caterer_ids = []
    caterer_user_ids = []

    for cd in caterer_data:
        existing = query(
            "SELECT u.id, c.id as caterer_id FROM users u JOIN caterers c ON c.user_id = u.id WHERE u.email=?",
            (cd['email'],), one=True
        )
        if existing:
            caterer_ids.append(existing['caterer_id'])
            caterer_user_ids.append(existing['id'])
            if cd.get('image_url'):
                execute("UPDATE caterers SET image_url=? WHERE id=?", (cd['image_url'], existing['caterer_id']))
            for item in cd['menu']:
                img_url = get_item_image(item)
                execute(
                    "UPDATE menu_items SET image_url=? WHERE caterer_id=? AND name=?",
                    (img_url, existing['caterer_id'], item['name'])
                )
            print(f"  [OK] Updated images for caterer {cd['business_name']} and all menu items.")
            continue

        user_id = execute(
            "INSERT INTO users (name,email,password_hash,role,phone) VALUES (?,?,?,?,?)",
            (cd['name'], cd['email'], hash_password('caterer123'), 'caterer', '+91 98765 43210')
        )
        caterer_id = execute(
            """INSERT INTO caterers
               (user_id,business_name,description,cuisine_types,event_types,
                service_area,min_guests,max_guests,base_price_per_person,
                verification_status,rating,review_count,image_url)
               VALUES (?,?,?,?,?,?,?,?,?,'approved',?,?,?)""",
            (user_id, cd['business_name'], cd['description'],
             json.dumps(cd['cuisine_types']), json.dumps(cd['event_types']),
             cd['service_area'], cd['min_guests'], cd['max_guests'],
             cd['base_price_per_person'], cd['rating'], cd['review_count'],
             cd.get('image_url', ''))
        )
        caterer_ids.append(caterer_id)
        caterer_user_ids.append(user_id)

        for item in cd['menu']:
            img_url = get_item_image(item)
            execute(
                """INSERT INTO menu_items
                   (caterer_id,name,description,category,price,unit,image_url,is_available)
                   VALUES (?,?,?,?,?,?,?,1)""",
                (caterer_id, item['name'], item.get('description', ''),
                 item['category'], item['price'], item.get('unit', 'per person'),
                 img_url)
            )
        print(f"  [OK] {cd['business_name']} created (id={caterer_id}, {len(cd['menu'])} items)")

    # ── Customers ──────────────────────────────────────────────────────────────
    print("\nSeeding customers...")
    customer_data = [
        {'name': 'Rahul Verma',   'email': 'rahul@example.com',   'phone': '+91 99001 23456'},
        {'name': 'Anjali Singh',  'email': 'anjali@example.com',  'phone': '+91 98765 11111'},
        {'name': 'Vikram Nair',   'email': 'vikram@example.com',  'phone': '+91 87654 22222'},
        {'name': 'Sneha Patil',   'email': 'sneha@example.com',   'phone': '+91 77654 33333'},
        {'name': 'Arun Kumar',    'email': 'arun@example.com',    'phone': '+91 99887 44444'},
    ]
    customer_ids = []
    for cu in customer_data:
        existing = query("SELECT id FROM users WHERE email=?", (cu['email'],), one=True)
        if existing:
            customer_ids.append(existing['id'])
            print(f"  Customer {cu['email']} already exists.")
            continue
        cid = execute(
            "INSERT INTO users (name,email,password_hash,role,phone) VALUES (?,?,?,?,?)",
            (cu['name'], cu['email'], hash_password('customer123'), 'customer', cu['phone'])
        )
        customer_ids.append(cid)
        print(f"  ✓ Customer {cu['name']} created (id={cid})")

    # ── Sample orders ──────────────────────────────────────────────────────────
    existing_orders = query("SELECT COUNT(*) AS cnt FROM orders", one=True)
    if existing_orders['cnt'] == 0 and len(caterer_ids) >= 2 and len(customer_ids) >= 1:
        print("\nCreating sample orders...")

        # Completed order - Spice Garden
        items0 = query("SELECT * FROM menu_items WHERE caterer_id=? LIMIT 3", (caterer_ids[0],))
        if items0:
            order_id = execute(
                """INSERT INTO orders (customer_id,caterer_id,guest_count,event_date,event_time,
                   event_address,event_type,special_instructions,total_cost,status)
                   VALUES (?,?,?,?,?,?,?,?,?,'completed')""",
                (customer_ids[0], caterer_ids[0], 150, '2026-06-15', '19:00',
                 '123 Juhu Beach Road, Mumbai 400049', 'Wedding',
                 'Please include extra rotis for children. No onion in any dish please.',
                 sum(i['price'] * 3 for i in items0))
            )
            for it in items0:
                execute("INSERT INTO order_items (order_id,menu_item_id,name,category,quantity,price_at_order) VALUES (?,?,?,?,?,?)",
                        (order_id, it['id'], it['name'], it['category'], 3, it['price']))
            for s in ['pending', 'accepted', 'confirmed', 'completed']:
                execute("INSERT INTO order_status_history (order_id,status,actor_name,actor_role) VALUES (?,?,?,?)",
                        (order_id, s, 'System', 'system'))
            execute("INSERT INTO messages (order_id,sender_id,sender_name,sender_role,content) VALUES (?,?,?,?,?)",
                    (order_id, customer_ids[0], 'Rahul Verma', 'customer',
                     'Hi! Please confirm the vegetarian menu. We have some Jain guests too.'))
            execute("INSERT INTO messages (order_id,sender_id,sender_name,sender_role,content) VALUES (?,?,?,?,?)",
                    (order_id, caterer_user_ids[0], 'Priya Sharma', 'caterer',
                     'Confirmed! We will have a fully vegetarian spread with Jain options clearly labeled.'))
            execute("INSERT INTO reviews (order_id,customer_id,caterer_id,rating,comment) VALUES (?,?,?,?,?)",
                    (order_id, customer_ids[0], caterer_ids[0], 5,
                     'Absolutely fantastic food! Everyone loved the dal makhani. Will definitely book again for our next event.'))
            print(f"  ✓ Completed order created (id={order_id})")

        # Pending order - Royal Feast
        if len(caterer_ids) >= 2:
            items1 = query("SELECT * FROM menu_items WHERE caterer_id=? LIMIT 4", (caterer_ids[1],))
            if items1:
                o2 = execute(
                    """INSERT INTO orders (customer_id,caterer_id,guest_count,event_date,event_time,
                       event_address,event_type,total_cost,status)
                       VALUES (?,?,?,?,?,?,?,?,'pending')""",
                    (customer_ids[0], caterer_ids[1], 300, '2026-10-20', '18:30',
                     '45 Bandra West, Mumbai 400050', 'Wedding',
                     sum(i['price'] * 5 for i in items1))
                )
                for it in items1:
                    execute("INSERT INTO order_items (order_id,menu_item_id,name,category,quantity,price_at_order) VALUES (?,?,?,?,?,?)",
                            (o2, it['id'], it['name'], it['category'], 5, it['price']))
                execute("INSERT INTO order_status_history (order_id,status,actor_name,actor_role,note) VALUES (?,?,?,?,?)",
                        (o2, 'pending', 'System', 'system', 'Order placed by customer'))
                print(f"  ✓ Pending order created (id={o2})")

        # Accepted order - Punjab Da Dhaba
        if len(caterer_ids) >= 7:
            items7 = query("SELECT * FROM menu_items WHERE caterer_id=? LIMIT 3", (caterer_ids[6],))
            if items7 and len(customer_ids) >= 2:
                o3 = execute(
                    """INSERT INTO orders (customer_id,caterer_id,guest_count,event_date,event_time,
                       event_address,event_type,total_cost,status)
                       VALUES (?,?,?,?,?,?,?,?,'accepted')""",
                    (customer_ids[1], caterer_ids[6], 200, '2026-11-05', '19:00',
                     '78 Vasant Kunj, New Delhi 110070', 'Birthday',
                     sum(i['price'] * 4 for i in items7))
                )
                for it in items7:
                    execute("INSERT INTO order_items (order_id,menu_item_id,name,category,quantity,price_at_order) VALUES (?,?,?,?,?,?)",
                            (o3, it['id'], it['name'], it['category'], 4, it['price']))
                for s in ['pending', 'accepted']:
                    execute("INSERT INTO order_status_history (order_id,status,actor_name,actor_role) VALUES (?,?,?,?)",
                            (o3, s, 'System', 'system'))
                print(f"  ✓ Accepted order created (id={o3})")

    print("\n=== Seed complete ===")
    print(f"  {len(caterer_data)} catering businesses | 150+ menu items with photos")
    print("\nLogin credentials:")
    print("  Admin:    admin@ecatring.com    / admin123")
    print("  Caterer:  priya@spicegarden.com / caterer123")
    print("  Customer: rahul@example.com     / customer123")
    print("\nAll caterers: password = caterer123")

if __name__ == '__main__':
    seed()
