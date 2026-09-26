-- ============ ENUMS ============
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled');
CREATE TYPE public.app_role AS ENUM ('admin','staff');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE d text;
BEGIN
  IF p_phone IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(translate(p_phone, '۰۱۲۳۴۵۶۷۸۹', '0123456789'), '[^0-9]', '', 'g');
  IF length(d) = 12 AND left(d,2) = '98' THEN d := '0' || substr(d,3); END IF;
  IF length(d) = 13 AND left(d,4) = '0098' THEN d := '0' || substr(d,5); END IF;
  IF length(d) = 10 AND left(d,1) = '9' THEN d := '0' || d; END IF;
  RETURN d;
END; $$;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Any authenticated user of this demo back-office is treated as staff/admin only
-- if they have a row in user_roles. Admin check helper:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active categories" ON public.categories FOR SELECT TO anon USING (active = true);
CREATE POLICY "auth read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  price numeric(12,0) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text NOT NULL UNIQUE,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_name ON public.products (name);
CREATE INDEX idx_products_sku ON public.products (sku);
CREATE INDEX idx_products_category ON public.products (category_id);
CREATE INDEX idx_products_active ON public.products (active);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon USING (active = true);
CREATE POLICY "auth read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write products" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON public.customers (phone);
CREATE INDEX idx_customers_email ON public.customers (email);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ ORDERS ============
CREATE SEQUENCE public.order_number_seq START WITH 10001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('ARYA-' || nextval('public.order_number_seq')),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal numeric(12,0) NOT NULL DEFAULT 0,
  shipping_cost numeric(12,0) NOT NULL DEFAULT 0,
  total numeric(12,0) NOT NULL DEFAULT 0,
  shipping_address text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_number ON public.orders (order_number);
CREATE INDEX idx_orders_customer ON public.orders (customer_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ ORDER ITEMS ============
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,0) NOT NULL,
  total_price numeric(12,0) NOT NULL
);
CREATE INDEX idx_order_items_order ON public.order_items (order_id);
CREATE INDEX idx_order_items_product ON public.order_items (product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage order items" ON public.order_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ STOCK RESTORE ON CANCEL ============
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p
       SET stock = p.stock + oi.quantity
      FROM public.order_items oi
     WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_cancel_restock AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ============ BUSINESS API (AI-agent friendly) ============
CREATE OR REPLACE FUNCTION public.create_order(
  p_full_name text, p_phone text, p_email text,
  p_shipping_address text, p_notes text, p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone text; v_customer_id uuid; v_order_id uuid; v_order_number text;
  v_subtotal numeric(12,0) := 0; v_shipping numeric(12,0) := 49000;
  it jsonb; v_product public.products%ROWTYPE; v_qty integer;
BEGIN
  v_phone := public.normalize_phone(p_phone);
  IF v_phone IS NULL OR length(v_phone) <> 11 OR left(v_phone,2) <> '09' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
  IF p_shipping_address IS NULL OR btrim(p_shipping_address) = '' THEN RAISE EXCEPTION 'INVALID_ADDRESS'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'EMPTY_CART'; END IF;

  SELECT id INTO v_customer_id FROM public.customers WHERE phone = v_phone;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (full_name, phone, email)
    VALUES (btrim(p_full_name), v_phone, nullif(btrim(coalesce(p_email,'')),''))
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
       SET full_name = btrim(p_full_name),
           email = coalesce(nullif(btrim(coalesce(p_email,'')),''), email)
     WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.orders (customer_id, shipping_address, notes, shipping_cost)
  VALUES (v_customer_id, btrim(p_shipping_address), nullif(btrim(coalesce(p_notes,'')),''), v_shipping)
  RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (it->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
    SELECT * INTO v_product FROM public.products
      WHERE id = (it->>'product_id')::uuid AND active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', v_product.name;
    END IF;
    UPDATE public.products SET stock = stock - v_qty WHERE id = v_product.id;
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (v_order_id, v_product.id, v_product.name, v_qty, v_product.price, v_product.price * v_qty);
    v_subtotal := v_subtotal + v_product.price * v_qty;
  END LOOP;

  UPDATE public.orders SET subtotal = v_subtotal, total = v_subtotal + v_shipping
   WHERE id = v_order_id;

  RETURN public.get_order_by_number(v_order_number, v_phone);
END; $$;

CREATE OR REPLACE FUNCTION public.get_order_by_number(p_order_number text, p_phone text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text; v_result jsonb;
BEGIN
  v_phone := public.normalize_phone(p_phone);
  SELECT jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'created_at', o.created_at,
    'subtotal', o.subtotal,
    'shipping_cost', o.shipping_cost,
    'total', o.total,
    'shipping_address', o.shipping_address,
    'notes', o.notes,
    'customer', jsonb_build_object('full_name', c.full_name, 'phone', c.phone, 'email', c.email),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name, 'quantity', oi.quantity,
        'unit_price', oi.unit_price, 'total_price', oi.total_price) ORDER BY oi.product_name)
      FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::jsonb)
  ) INTO v_result
  FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
  WHERE upper(btrim(o.order_number)) = upper(btrim(p_order_number)) AND c.phone = v_phone;

  IF v_result IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_number text, p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text; v_order public.orders%ROWTYPE;
BEGIN
  v_phone := public.normalize_phone(p_phone);
  SELECT o.* INTO v_order FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
   WHERE upper(btrim(o.order_number)) = upper(btrim(p_order_number)) AND c.phone = v_phone
   FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_order.status = 'cancelled' THEN RAISE EXCEPTION 'ALREADY_CANCELLED'; END IF;
  IF v_order.status IN ('delivered','shipped') THEN RAISE EXCEPTION 'CANNOT_CANCEL'; END IF;
  UPDATE public.orders SET status = 'cancelled' WHERE id = v_order.id;
  RETURN public.get_order_by_number(v_order.order_number, v_phone);
END; $$;

CREATE OR REPLACE FUNCTION public.get_customer_orders(p_phone text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phone text;
BEGIN
  v_phone := public.normalize_phone(p_phone);
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'order_number', o.order_number, 'status', o.status, 'total', o.total,
      'created_at', o.created_at,
      'items_count', (SELECT coalesce(sum(oi.quantity),0) FROM public.order_items oi WHERE oi.order_id = o.id)
    ) ORDER BY o.created_at DESC)
    FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
    WHERE c.phone = v_phone), '[]'::jsonb);
END; $$;

REVOKE ALL ON FUNCTION public.create_order(text,text,text,text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,text,text,text,jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(text,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_order(text,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text) TO anon, authenticated, service_role;

-- ============ SEED: CATEGORIES ============
INSERT INTO public.categories (name, slug, description, image, active) VALUES
('موبایل','mobile','انواع گوشی‌های هوشمند برندهای معتبر','/images/mobile.jpg',true),
('لپ‌تاپ','laptop','لپ‌تاپ‌های اداری، دانشجویی و گیمینگ','/images/laptop.jpg',true),
('هدفون','headphone','هدفون و هندزفری سیمی و بلوتوثی','/images/headphone.jpg',true),
('لوازم جانبی','accessories','شارژر، پاوربانک، کابل و قاب','/images/accessories.jpg',true),
('ساعت هوشمند','smartwatch','ساعت‌های هوشمند و مچ‌بند سلامتی','/images/watch.jpg',true);

-- ============ SEED: PRODUCTS ============
INSERT INTO public.products (category_id, name, slug, description, short_description, price, stock, sku, image_url, active)
SELECT c.id, v.name, v.slug, v.description, v.short_description, v.price, v.stock, v.sku, v.image_url, true
FROM (VALUES
('mobile','گوشی موبایل سامسونگ Galaxy A55','samsung-galaxy-a55','گوشی هوشمند سامسونگ گلکسی A55 با نمایشگر ۶.۶ اینچی سوپر امولد، دوربین ۵۰ مگاپیکسلی و باتری ۵۰۰۰ میلی‌آمپرساعتی. مناسب برای استفاده روزمره و عکاسی.','نمایشگر ۶.۶ اینچی، دوربین ۵۰ مگاپیکسل، ۸ گیگ رم',24500000,12,'MOB-SAM-A55','/images/mobile.jpg'),
('mobile','گوشی موبایل شیائومی Redmi Note 13 Pro','xiaomi-redmi-note-13-pro','ردمی نوت ۱۳ پرو با پردازنده قدرتمند، شارژ سریع ۶۷ وات و دوربین ۲۰۰ مگاپیکسلی؛ انتخابی مقرون‌به‌صرفه با کارایی بالا.','دوربین ۲۰۰ مگاپیکسل، شارژ سریع ۶۷ وات',18900000,25,'MOB-XIA-N13P','/images/mobile.jpg'),
('mobile','گوشی موبایل اپل iPhone 15','apple-iphone-15','آیفون ۱۵ با تراشه A16 Bionic، بدنه آلومینیومی، پورت تایپ‌سی و دوربین اصلی ۴۸ مگاپیکسلی.','تراشه A16، دوربین ۴۸ مگاپیکسل، پورت USB-C',72000000,4,'MOB-APL-I15','/images/mobile.jpg'),
('mobile','گوشی موبایل نوکیا G42','nokia-g42','نوکیا G42 با طراحی ساده، باتری پرظرفیت و قابلیت تعمیر آسان؛ گزینه‌ای اقتصادی برای مصارف روزمره.','باتری ۵۰۰۰ میلی‌آمپر، اقتصادی',7900000,30,'MOB-NOK-G42','/images/mobile.jpg'),
('laptop','لپ‌تاپ ایسوس VivoBook 15','asus-vivobook-15','لپ‌تاپ ایسوس VivoBook 15 با پردازنده Core i5 نسل ۱۲، ۱۶ گیگابایت رم و ۵۱۲ گیگابایت حافظه SSD، مناسب کارهای اداری و دانشجویی.','Core i5، ۱۶ گیگ رم، ۵۱۲ گیگ SSD',42500000,8,'LAP-ASU-VB15','/images/laptop.jpg'),
('laptop','لپ‌تاپ لنوو IdeaPad 3','lenovo-ideapad-3','لنوو آیدیاپد ۳ با پردازنده Ryzen 5، نمایشگر ۱۵.۶ اینچی فول‌اچ‌دی و وزن سبک برای حمل روزانه.','Ryzen 5، ۸ گیگ رم، نمایشگر فول‌اچ‌دی',31200000,6,'LAP-LEN-IP3','/images/laptop.jpg'),
('laptop','لپ‌تاپ اپل MacBook Air M2','apple-macbook-air-m2','مک‌بوک ایر M2 با بدنه فوق‌باریک، نمایشگر Liquid Retina و باتری تا ۱۸ ساعت کارکرد.','تراشه M2، ۸ گیگ رم، ۲۵۶ گیگ SSD',89000000,3,'LAP-APL-MBA2','/images/laptop.jpg'),
('headphone','هدفون بی‌سیم سونی WH-CH720N','sony-wh-ch720n','هدفون روگوشی سونی با حذف نویز فعال، وزن سبک و باتری تا ۳۵ ساعت پخش موسیقی.','نویز کنسلینگ فعال، ۳۵ ساعت باتری',8900000,18,'HDP-SON-CH720','/images/headphone.jpg'),
('headphone','هدفون بلوتوث JBL Tune 510BT','jbl-tune-510bt','هدفون جی‌بی‌ال Tune 510BT با صدای Pure Bass، اتصال بلوتوث ۵.۰ و قابلیت تاشو.','بلوتوث ۵.۰، صدای Pure Bass',3450000,40,'HDP-JBL-510','/images/headphone.jpg'),
('headphone','هدفون گیمینگ ریزر Kraken X','razer-kraken-x','هدفون گیمینگ ریزر کراکن ایکس با صدای فراگیر ۷.۱، میکروفون خم‌شو و بالشتک‌های نرم.','صدای ۷.۱، میکروفون خم‌شو',4980000,2,'HDP-RAZ-KRX','/images/headphone.jpg'),
('accessories','شارژر فست سامسونگ ۲۵ وات','samsung-charger-25w','شارژر اصلی سامسونگ با توان ۲۵ وات و پشتیبانی از استاندارد PD؛ همراه با کابل تایپ‌سی.','۲۵ وات، استاندارد PD',890000,60,'ACC-SAM-C25','/images/accessories.jpg'),
('accessories','پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر','anker-powerbank-20000','پاوربانک انکر با ظرفیت ۲۰۰۰۰ میلی‌آمپرساعت، دو خروجی USB و شارژ سریع برای سفر و کار.','۲۰۰۰۰ میلی‌آمپر، دو خروجی',2650000,22,'ACC-ANK-PB20','/images/accessories.jpg'),
('accessories','کابل USB-C بیسوس ۱ متری','baseus-usb-c-cable','کابل شارژ و انتقال داده بیسوس با روکش نایلونی مقاوم و پشتیبانی از جریان ۳ آمپر.','۱ متر، ۳ آمپر، روکش نایلونی',320000,150,'ACC-BAS-CBL1','/images/accessories.jpg'),
('accessories','قاب محافظ شفاف ژله‌ای','clear-jelly-case','قاب ژله‌ای شفاف با لبه‌های برجسته برای محافظت از دوربین و نمایشگر گوشی.','ژله‌ای شفاف، محافظ دوربین',180000,1,'ACC-GEN-CASE','/images/accessories.jpg'),
('smartwatch','ساعت هوشمند شیائومی Watch S3','xiaomi-watch-s3','ساعت هوشمند شیائومی S3 با نمایشگر AMOLED، پایش ضربان قلب و اکسیژن خون و بیش از ۱۵۰ حالت ورزشی.','AMOLED، پایش سلامتی، ۱۵۰ حالت ورزشی',5450000,14,'WCH-XIA-S3','/images/watch.jpg'),
('smartwatch','ساعت هوشمند هایلو Solar LS05','haylou-solar-ls05','ساعت هوشمند هایلو سولار با باتری ۳۰ روزه، ضدآب IP68 و طراحی کلاسیک.','باتری ۳۰ روزه، ضدآب IP68',1790000,35,'WCH-HAY-LS05','/images/watch.jpg')
) AS v(cat_slug,name,slug,description,short_description,price,stock,sku,image_url)
JOIN public.categories c ON c.slug = v.cat_slug;

-- ============ SEED: CUSTOMERS ============
INSERT INTO public.customers (full_name, phone, email) VALUES
('علی رضایی','09121234567','ali.rezaei@example.com'),
('مریم حسینی','09123334455','maryam.hosseini@example.com'),
('محمد کریمی','09351112233',NULL),
('زهرا محمدی','09197778899','zahra.mohammadi@example.com'),
('رضا موسوی','09027776655',NULL),
('فاطمه احمدی','09131234589','f.ahmadi@example.com'),
('حسین نوری','09365554433','hossein.nouri@example.com'),
('سارا قاسمی','09112223344',NULL);

-- ============ SEED: ORDERS ============
INSERT INTO public.orders (order_number, customer_id, status, shipping_address, notes, shipping_cost, created_at)
SELECT v.order_number, c.id, v.status::public.order_status, v.address, v.notes, 49000, now() - (v.days_ago || ' days')::interval
FROM (VALUES
('ARYA-10001','09121234567','delivered','تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳','لطفاً قبل از ارسال تماس بگیرید',45),
('ARYA-10002','09123334455','delivered','اصفهان، خیابان چهارباغ بالا، مجتمع نگین، طبقه ۴',NULL,40),
('ARYA-10003','09351112233','cancelled','مشهد، بلوار وکیل‌آباد، خیابان لادن، پلاک ۸','منصرف شدم',38),
('ARYA-10004','09197778899','delivered','شیراز، بلوار زند، کوچه ۱۵، پلاک ۲۲',NULL,33),
('ARYA-10005','09027776655','shipped','تبریز، خیابان آزادی، کوی گلستان، پلاک ۵',NULL,20),
('ARYA-10006','09131234589','processing','کرج، مهرشهر، بلوار ارم، پلاک ۱۰۱','ارسال در ساعات عصر',12),
('ARYA-10007','09365554433','pending','رشت، خیابان معلم، کوچه شهید رضایی، پلاک ۷',NULL,9),
('ARYA-10008','09112223344','confirmed','قم، بلوار امین، خیابان ششم، پلاک ۳',NULL,8),
('ARYA-10009','09121234567','delivered','تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳',NULL,30),
('ARYA-10010','09123334455','shipped','اصفهان، خیابان چهارباغ بالا، مجتمع نگین، طبقه ۴','بسته‌بندی هدیه',7),
('ARYA-10011','09197778899','cancelled','شیراز، بلوار زند، کوچه ۱۵، پلاک ۲۲','سفارش اشتباه ثبت شد',18),
('ARYA-10012','09351112233','processing','مشهد، بلوار وکیل‌آباد، خیابان لادن، پلاک ۸',NULL,5),
('ARYA-10013','09027776655','pending','تبریز، خیابان آزادی، کوی گلستان، پلاک ۵',NULL,3),
('ARYA-10014','09131234589','delivered','کرج، مهرشهر، بلوار ارم، پلاک ۱۰۱',NULL,26),
('ARYA-10015','09365554433','confirmed','رشت، خیابان معلم، کوچه شهید رضایی، پلاک ۷','تحویل درب منزل',4),
('ARYA-10016','09112223344','shipped','قم، بلوار امین، خیابان ششم، پلاک ۳',NULL,6),
('ARYA-10017','09121234567','pending','تهران، سعادت‌آباد، بلوار دریا، پلاک ۴۴، واحد ۱۱',NULL,2),
('ARYA-10018','09123334455','processing','اصفهان، خیابان چهارباغ بالا، مجتمع نگین، طبقه ۴',NULL,1)
) AS v(order_number,phone,status,address,notes,days_ago)
JOIN public.customers c ON c.phone = v.phone;

SELECT setval('public.order_number_seq', 10018);

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, v.qty, p.price, p.price * v.qty
FROM (VALUES
('ARYA-10001','MOB-SAM-A55',1),('ARYA-10001','ACC-SAM-C25',1),
('ARYA-10002','HDP-JBL-510',2),
('ARYA-10003','LAP-ASU-VB15',1),
('ARYA-10004','WCH-XIA-S3',1),('ARYA-10004','ACC-BAS-CBL1',2),
('ARYA-10005','MOB-XIA-N13P',1),
('ARYA-10006','LAP-LEN-IP3',1),('ARYA-10006','ACC-ANK-PB20',1),
('ARYA-10007','HDP-SON-CH720',1),
('ARYA-10008','ACC-ANK-PB20',2),
('ARYA-10009','MOB-APL-I15',1),
('ARYA-10010','WCH-HAY-LS05',3),
('ARYA-10011','LAP-APL-MBA2',1),
('ARYA-10012','HDP-RAZ-KRX',1),('ARYA-10012','ACC-GEN-CASE',1),
('ARYA-10013','MOB-NOK-G42',1),
('ARYA-10014','ACC-SAM-C25',2),('ARYA-10014','ACC-BAS-CBL1',3),
('ARYA-10015','WCH-XIA-S3',1),
('ARYA-10016','MOB-SAM-A55',1),
('ARYA-10017','HDP-JBL-510',1),('ARYA-10017','ACC-BAS-CBL1',1),
('ARYA-10018','MOB-XIA-N13P',2)
) AS v(order_number,sku,qty)
JOIN public.orders o ON o.order_number = v.order_number
JOIN public.products p ON p.sku = v.sku;

UPDATE public.orders o
SET subtotal = s.sum_total, total = s.sum_total + o.shipping_cost
FROM (SELECT order_id, sum(total_price) AS sum_total FROM public.order_items GROUP BY order_id) s
WHERE s.order_id = o.id;