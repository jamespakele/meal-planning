-- Insert sample meals to get started
INSERT INTO meals (title, description, category, prep_time_minutes, cook_time_minutes, serving_size_base, ingredients, instructions, dietary_tags) VALUES
(
    'Spaghetti with Marinara Sauce',
    'Classic Italian pasta dish with homemade marinara sauce',
    'whole_house',
    15,
    25,
    4,
    '[
        {"name": "Spaghetti pasta", "quantity": 1, "unit": "lb", "category": "pantry"},
        {"name": "Crushed tomatoes", "quantity": 28, "unit": "oz", "category": "pantry"},
        {"name": "Garlic", "quantity": 4, "unit": "cloves", "category": "produce"},
        {"name": "Onion", "quantity": 1, "unit": "medium", "category": "produce"},
        {"name": "Olive oil", "quantity": 2, "unit": "tbsp", "category": "pantry"},
        {"name": "Basil", "quantity": 2, "unit": "tsp", "category": "produce"},
        {"name": "Salt", "quantity": 1, "unit": "tsp", "category": "pantry"},
        {"name": "Black pepper", "quantity": 0.5, "unit": "tsp", "category": "pantry"}
    ]',
    '{
        "1. Boil water in large pot and cook spaghetti according to package directions",
        "2. Heat olive oil in large skillet over medium heat",
        "3. Add diced onion and garlic, cook until softened",
        "4. Add crushed tomatoes, basil, salt, and pepper",
        "5. Simmer for 15 minutes, stirring occasionally",
        "6. Drain pasta and serve with sauce"
    }',
    '{"vegetarian", "dairy-free"}'
),
(
    'Chicken Stir Fry',
    'Quick and healthy chicken stir fry with mixed vegetables',
    'whole_house',
    10,
    15,
    4,
    '[
        {"name": "Chicken breast", "quantity": 1.5, "unit": "lbs", "category": "meat"},
        {"name": "Mixed stir fry vegetables", "quantity": 16, "unit": "oz", "category": "frozen"},
        {"name": "Soy sauce", "quantity": 3, "unit": "tbsp", "category": "pantry"},
        {"name": "Sesame oil", "quantity": 1, "unit": "tbsp", "category": "pantry"},
        {"name": "Garlic", "quantity": 3, "unit": "cloves", "category": "produce"},
        {"name": "Ginger", "quantity": 1, "unit": "tbsp", "category": "produce"},
        {"name": "Rice", "quantity": 2, "unit": "cups", "category": "pantry"}
    ]',
    '{
        "1. Cook rice according to package directions",
        "2. Cut chicken into bite-sized pieces",
        "3. Heat oil in large wok or skillet over high heat",
        "4. Add chicken and cook until golden brown",
        "5. Add garlic and ginger, cook for 1 minute",
        "6. Add vegetables and stir fry for 5 minutes",
        "7. Add soy sauce and sesame oil, toss to combine",
        "8. Serve over rice"
    }',
    '{"gluten-free", "dairy-free"}'
),
(
    'Mac and Cheese',
    'Creamy homemade mac and cheese - kid favorite!',
    'group_specific',
    10,
    20,
    6,
    '[
        {"name": "Elbow macaroni", "quantity": 16, "unit": "oz", "category": "pantry"},
        {"name": "Sharp cheddar cheese", "quantity": 8, "unit": "oz", "category": "dairy"},
        {"name": "Milk", "quantity": 2, "unit": "cups", "category": "dairy"},
        {"name": "Butter", "quantity": 4, "unit": "tbsp", "category": "dairy"},
        {"name": "All-purpose flour", "quantity": 4, "unit": "tbsp", "category": "pantry"},
        {"name": "Salt", "quantity": 1, "unit": "tsp", "category": "pantry"},
        {"name": "Pepper", "quantity": 0.25, "unit": "tsp", "category": "pantry"}
    ]',
    '{
        "1. Cook macaroni according to package directions, drain",
        "2. In same pot, melt butter over medium heat",
        "3. Whisk in flour and cook for 1 minute",
        "4. Gradually whisk in milk until smooth",
        "5. Bring to simmer and cook until thickened",
        "6. Remove from heat and stir in cheese until melted",
        "7. Add cooked pasta and stir to combine",
        "8. Season with salt and pepper"
    }',
    '{"vegetarian", "kid-friendly"}'
),
(
    'Overnight Oats',
    'Healthy make-ahead breakfast option',
    'breakfast',
    5,
    0,
    1,
    '[
        {"name": "Rolled oats", "quantity": 0.5, "unit": "cup", "category": "pantry"},
        {"name": "Milk", "quantity": 0.5, "unit": "cup", "category": "dairy"},
        {"name": "Greek yogurt", "quantity": 2, "unit": "tbsp", "category": "dairy"},
        {"name": "Honey", "quantity": 1, "unit": "tbsp", "category": "pantry"},
        {"name": "Vanilla extract", "quantity": 0.5, "unit": "tsp", "category": "pantry"},
        {"name": "Mixed berries", "quantity": 0.25, "unit": "cup", "category": "produce"}
    ]',
    '{
        "1. Combine oats, milk, yogurt, honey, and vanilla in jar",
        "2. Stir well to combine",
        "3. Add berries on top",
        "4. Cover and refrigerate overnight",
        "5. Enjoy cold in the morning"
    }',
    '{"vegetarian", "gluten-free", "healthy"}'
),
(
    'Peanut Butter Sandwiches',
    'Quick and easy backup meal option',
    'backup',
    5,
    0,
    4,
    '[
        {"name": "Bread", "quantity": 8, "unit": "slices", "category": "pantry"},
        {"name": "Peanut butter", "quantity": 0.5, "unit": "cup", "category": "pantry"},
        {"name": "Jelly", "quantity": 0.25, "unit": "cup", "category": "pantry"}
    ]',
    '{
        "1. Lay out bread slices",
        "2. Spread peanut butter on half the slices",
        "3. Spread jelly on remaining slices",
        "4. Combine to make sandwiches",
        "5. Cut in half if desired"
    }',
    '{"vegetarian", "kid-friendly", "quick"}'
);

-- Create some default household group templates
CREATE TABLE household_group_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    adult_count INTEGER DEFAULT 0,
    teen_count INTEGER DEFAULT 0,
    child_count INTEGER DEFAULT 0,
    toddler_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

INSERT INTO household_group_templates (name, description, adult_count, teen_count, child_count, toddler_count) VALUES
('Whole House', 'Everyone in the household', 2, 1, 2, 0),
('Adults Only', 'Just the adult members', 2, 0, 0, 0),
('Just Kids', 'Children and teenagers only', 0, 1, 2, 0),
('Nuclear Family', 'Parents and their children', 2, 0, 2, 0),
('Kids and One Parent', 'Single parent with children', 1, 1, 2, 0),
('Extended Family', 'Including grandparents or other adults', 4, 1, 2, 0);