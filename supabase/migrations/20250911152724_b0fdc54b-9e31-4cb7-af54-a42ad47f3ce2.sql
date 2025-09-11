-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  origin_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('walk', 'car', 'bus', 'train', 'bike', 'other')),
  purpose TEXT NOT NULL CHECK (purpose IN ('work', 'education', 'shopping', 'leisure', 'personal', 'medical', 'other')),
  companion TEXT NOT NULL CHECK (companion IN ('alone', 'family', 'friends', 'colleagues', 'other')),
  distance DOUBLE PRECISION,
  duration INTEGER,
  notes TEXT,
  is_auto_detected BOOLEAN DEFAULT false,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create policies for trips
CREATE POLICY "Users can view their own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" 
ON public.trips 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_profiles table for travel diary specific user data
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_detection_enabled BOOLEAN DEFAULT true,
  privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'full')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trip_statistics table for aggregated data
CREATE TABLE public.trip_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_distance DOUBLE PRECISION DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  trip_count INTEGER DEFAULT 0,
  mode_breakdown JSONB DEFAULT '{}',
  purpose_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for trip_statistics
ALTER TABLE public.trip_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for trip_statistics
CREATE POLICY "Users can view their own statistics" 
ON public.trip_statistics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage statistics" 
ON public.trip_statistics 
FOR ALL 
USING (true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_travel_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created_travel
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_travel_user();

-- Create indexes for better performance
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_start_time ON public.trips(start_time);
CREATE INDEX idx_trips_mode ON public.trips(mode);
CREATE INDEX idx_trips_purpose ON public.trips(purpose);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_trip_statistics_user_id ON public.trip_statistics(user_id);