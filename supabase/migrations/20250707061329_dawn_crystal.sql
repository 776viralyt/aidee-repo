-- =============================================
-- Enhanced Trainer System SQL Queries
-- Run these in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. ENHANCED TRAINER STATISTICS AND QUERIES
-- =============================================

-- Create enhanced trainer stats function
CREATE OR REPLACE FUNCTION get_enhanced_trainer_stats(trainer_profile_id uuid)
RETURNS TABLE (
  trainer_id uuid,
  trainer_name text,
  total_clients bigint,
  active_clients bigint,
  today_sessions bigint,
  completed_today bigint,
  pending_today bigint,
  weekly_sessions bigint,
  monthly_sessions bigint,
  avg_session_rating numeric,
  total_revenue numeric,
  client_retention_rate numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as trainer_id,
    p.full_name as trainer_name,
    COALESCE(COUNT(DISTINCT ca.client_id), 0) as total_clients,
    COALESCE(COUNT(DISTINCT CASE WHEN ca.status = 'active' THEN ca.client_id END), 0) as active_clients,
    COALESCE(COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE THEN ts.id END), 0) as today_sessions,
    COALESCE(COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'completed' THEN ts.id END), 0) as completed_today,
    COALESCE(COUNT(DISTINCT CASE WHEN ts.scheduled_date = CURRENT_DATE AND ts.status = 'scheduled' THEN ts.id END), 0) as pending_today,
    COALESCE(COUNT(DISTINCT CASE WHEN ts.scheduled_date >= CURRENT_DATE - INTERVAL '7 days' THEN ts.id END), 0) as weekly_sessions,
    COALESCE(COUNT(DISTINCT CASE WHEN ts.scheduled_date >= CURRENT_DATE - INTERVAL '30 days' THEN ts.id END), 0) as monthly_sessions,
    COALESCE(AVG(CASE WHEN ts.session_rating IS NOT NULL THEN ts.session_rating END), 0) as avg_session_rating,
    COALESCE(SUM(CASE WHEN ts.status = 'completed' AND ts.session_fee IS NOT NULL THEN ts.session_fee END), 0) as total_revenue,
    CASE 
      WHEN COUNT(DISTINCT ca.client_id) > 0 THEN 
        (COUNT(DISTINCT CASE WHEN ca.status = 'active' THEN ca.client_id END)::numeric / COUNT(DISTINCT ca.client_id)::numeric) * 100
      ELSE 0 
    END as client_retention_rate
  FROM profiles p
  LEFT JOIN client_assignments ca ON ca.trainer_id = p.id
  LEFT JOIN training_sessions ts ON ts.trainer_id = p.id
  WHERE p.id = trainer_profile_id AND p.role = 'trainer'
  GROUP BY p.id, p.full_name;
END;
$$;

-- =============================================
-- 2. ENHANCED CLIENT DATA QUERIES
-- =============================================

-- Create enhanced client data function
CREATE OR REPLACE FUNCTION get_enhanced_active_clients(trainer_profile_id uuid)
RETURNS TABLE (
  id uuid,
  client_name text,
  full_name text,
  email text,
  avatar_url text,
  fitness_goals text[],
  activity_status text,
  last_session_date date,
  next_session_date date,
  total_sessions bigint,
  completed_sessions bigint,
  progress_score numeric,
  avg_rating numeric,
  compliance_rate numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name as client_name,
    c.full_name,
    c.email,
    c.avatar_url,
    COALESCE(c.fitness_goals, ARRAY[]::text[]) as fitness_goals,
    CASE 
      WHEN MAX(ts.scheduled_date) >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
      WHEN MAX(ts.scheduled_date) >= CURRENT_DATE - INTERVAL '14 days' THEN 'inactive'
      ELSE 'dormant'
    END as activity_status,
    MAX(CASE WHEN ts.status = 'completed' THEN ts.scheduled_date END) as last_session_date,
    MIN(CASE WHEN ts.status = 'scheduled' AND ts.scheduled_date >= CURRENT_DATE THEN ts.scheduled_date END) as next_session_date,
    COALESCE(COUNT(ts.id), 0) as total_sessions,
    COALESCE(COUNT(CASE WHEN ts.status = 'completed' THEN ts.id END), 0) as completed_sessions,
    CASE 
      WHEN COUNT(ts.id) > 0 THEN 
        (COUNT(CASE WHEN ts.status = 'completed' THEN ts.id END)::numeric / COUNT(ts.id)::numeric) * 100
      ELSE 0 
    END as progress_score,
    COALESCE(AVG(CASE WHEN ts.session_rating IS NOT NULL THEN ts.session_rating END), 0) as avg_rating,
    CASE 
      WHEN COUNT(CASE WHEN ts.status IN ('scheduled', 'completed') THEN ts.id END) > 0 THEN
        (COUNT(CASE WHEN ts.status = 'completed' THEN ts.id END)::numeric / 
         COUNT(CASE WHEN ts.status IN ('scheduled', 'completed') THEN ts.id END)::numeric) * 100
      ELSE 0
    END as compliance_rate,
    c.created_at
  FROM profiles c
  INNER JOIN client_assignments ca ON ca.client_id = c.id
  LEFT JOIN training_sessions ts ON ts.client_id = c.id AND ts.trainer_id = trainer_profile_id
  WHERE ca.trainer_id = trainer_profile_id 
    AND ca.status = 'active'
    AND c.role = 'client'
  GROUP BY c.id, c.full_name, c.email, c.avatar_url, c.fitness_goals, c.created_at
  ORDER BY MAX(ts.scheduled_date) DESC NULLS LAST;
END;
$$;

-- =============================================
-- 3. SESSION MANAGEMENT ENHANCEMENTS
-- =============================================

-- Add missing columns to training_sessions table
DO $$
BEGIN
  -- Add session_rating column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'session_rating'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN session_rating integer CHECK (session_rating >= 1 AND session_rating <= 5);
  END IF;

  -- Add trainer_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'trainer_notes'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN trainer_notes text;
  END IF;

  -- Add session_fee column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'session_fee'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN session_fee decimal(10,2);
  END IF;

  -- Add completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add missing columns to profiles table
DO $$
BEGIN
  -- Add fitness_goals column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'fitness_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fitness_goals text[] DEFAULT ARRAY[]::text[];
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add date_of_birth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;
END $$;

-- =============================================
-- 4. SESSION NOTIFICATIONS SYSTEM
-- =============================================

-- Create session_notifications table
CREATE TABLE IF NOT EXISTS session_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('reminder', 'confirmation', 'cancellation', 'completion', 'no_show')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for session_notifications
ALTER TABLE session_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for session_notifications
CREATE POLICY "Users can read own session notifications"
  ON session_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE (p.id = client_id OR p.id = trainer_id) AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage session notifications"
  ON session_notifications
  FOR ALL
  TO authenticated
  USING (true);

-- =============================================
-- 5. CLIENT ACTIVITY LOG SYSTEM
-- =============================================

-- Create client_activity_log table
CREATE TABLE IF NOT EXISTS client_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type text CHECK (activity_type IN ('session_completed', 'session_cancelled', 'goal_achieved', 'progress_updated', 'message_sent', 'login', 'workout_logged')) NOT NULL,
  description text NOT NULL,
  activity_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for client_activity_log
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for client_activity_log
CREATE POLICY "Trainers can read client activity"
  ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = trainer_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can read own activity"
  ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = client_id AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- 6. ENHANCED QUERY FUNCTIONS
-- =============================================

-- Function to get today's sessions for trainer
CREATE OR REPLACE FUNCTION get_enhanced_today_sessions(trainer_profile_id uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client jsonb,
  scheduled_date date,
  scheduled_time time,
  duration_minutes integer,
  type text,
  status text,
  location text,
  notes text,
  trainer_notes text,
  session_rating integer,
  session_fee decimal,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.client_id,
    jsonb_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'email', c.email,
      'avatar_url', c.avatar_url,
      'fitness_goals', c.fitness_goals
    ) as client,
    ts.scheduled_date,
    ts.scheduled_time,
    ts.duration_minutes,
    ts.type,
    ts.status,
    ts.location,
    ts.notes,
    ts.trainer_notes,
    ts.session_rating,
    ts.session_fee,
    ts.completed_at,
    ts.created_at
  FROM training_sessions ts
  INNER JOIN profiles c ON c.id = ts.client_id
  WHERE ts.trainer_id = trainer_profile_id 
    AND ts.scheduled_date = CURRENT_DATE
  ORDER BY ts.scheduled_time ASC;
END;
$$;

-- Function to get upcoming sessions for trainer
CREATE OR REPLACE FUNCTION get_enhanced_upcoming_sessions(trainer_profile_id uuid, days_ahead integer DEFAULT 7)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  client jsonb,
  scheduled_date date,
  scheduled_time time,
  duration_minutes integer,
  type text,
  status text,
  location text,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.client_id,
    jsonb_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'email', c.email,
      'avatar_url', c.avatar_url,
      'fitness_goals', c.fitness_goals
    ) as client,
    ts.scheduled_date,
    ts.scheduled_time,
    ts.duration_minutes,
    ts.type,
    ts.status,
    ts.location,
    ts.notes,
    ts.created_at
  FROM training_sessions ts
  INNER JOIN profiles c ON c.id = ts.client_id
  WHERE ts.trainer_id = trainer_profile_id 
    AND ts.scheduled_date > CURRENT_DATE
    AND ts.scheduled_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND ts.status = 'scheduled'
  ORDER BY ts.scheduled_date ASC, ts.scheduled_time ASC;
END;
$$;

-- Function to complete a training session
CREATE OR REPLACE FUNCTION complete_enhanced_training_session(
  session_id uuid,
  trainer_notes_param text DEFAULT NULL,
  session_rating_param integer DEFAULT NULL,
  session_fee_param decimal DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  session_record training_sessions%ROWTYPE;
BEGIN
  -- Get the session record
  SELECT * INTO session_record FROM training_sessions WHERE id = session_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the session
  UPDATE training_sessions 
  SET 
    status = 'completed',
    completed_at = now(),
    trainer_notes = COALESCE(trainer_notes_param, trainer_notes),
    session_rating = COALESCE(session_rating_param, session_rating),
    session_fee = COALESCE(session_fee_param, session_fee),
    updated_at = now()
  WHERE id = session_id;
  
  -- Log the activity
  INSERT INTO client_activity_log (client_id, trainer_id, activity_type, description, metadata)
  VALUES (
    session_record.client_id,
    session_record.trainer_id,
    'session_completed',
    'Training session completed: ' || session_record.type,
    jsonb_build_object(
      'session_id', session_id,
      'session_type', session_record.type,
      'duration_minutes', session_record.duration_minutes,
      'rating', session_rating_param
    )
  );
  
  -- Create completion notification
  INSERT INTO session_notifications (session_id, client_id, trainer_id, notification_type, title, message)
  VALUES (
    session_id,
    session_record.client_id,
    session_record.trainer_id,
    'completion',
    'Session Completed',
    'Your training session has been completed. Great work!'
  );
  
  RETURN true;
END;
$$;

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_date ON training_sessions(trainer_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_client_date ON training_sessions(client_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_notifications_trainer ON session_notifications(trainer_id, read);
CREATE INDEX IF NOT EXISTS idx_session_notifications_client ON session_notifications(client_id, read);
CREATE INDEX IF NOT EXISTS idx_client_activity_trainer ON client_activity_log(trainer_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_client_activity_client ON client_activity_log(client_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_client_assignments_trainer_status ON client_assignments(trainer_id, status);

-- =============================================
-- 8. SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample fitness goals for existing clients
UPDATE profiles 
SET fitness_goals = ARRAY['Weight Loss', 'Strength Building']
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE profiles 
SET fitness_goals = ARRAY['Muscle Gain', 'Athletic Performance']
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Insert sample session notifications
INSERT INTO session_notifications (session_id, client_id, trainer_id, notification_type, title, message, read) 
SELECT 
  ts.id,
  ts.client_id,
  ts.trainer_id,
  'reminder',
  'Session Reminder',
  'Your training session is scheduled for today at ' || ts.scheduled_time::text,
  false
FROM training_sessions ts
WHERE ts.scheduled_date = CURRENT_DATE
ON CONFLICT DO NOTHING;

-- Insert sample client activity
INSERT INTO client_activity_log (client_id, trainer_id, activity_type, description, activity_date)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'session_completed', 'Completed strength training session', now() - INTERVAL '2 hours'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'progress_updated', 'Updated body measurements', now() - INTERVAL '1 day'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'goal_achieved', 'Reached weekly workout goal', now() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. UTILITY FUNCTIONS
-- =============================================

-- Function to update trainer dashboard stats (can be called periodically)
CREATE OR REPLACE FUNCTION update_trainer_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be used to update cached statistics
  -- For now, it's a placeholder for future optimizations
  
  -- Update any cached statistics tables here
  -- Example: REFRESH MATERIALIZED VIEW trainer_stats_cache;
  
  RAISE NOTICE 'Trainer dashboard stats updated at %', now();
END;
$$;

-- Function to log client activity
CREATE OR REPLACE FUNCTION log_client_activity(
  client_profile_id uuid,
  trainer_profile_id uuid DEFAULT NULL,
  activity_type_param text,
  description_param text,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO client_activity_log (client_id, trainer_id, activity_type, description, metadata)
  VALUES (client_profile_id, trainer_profile_id, activity_type_param, description_param, metadata_param)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Add a comment to indicate successful completion
COMMENT ON SCHEMA public IS 'Enhanced Trainer System - Database schema updated successfully with all required functions and tables';

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced Trainer System database schema has been successfully created!';
  RAISE NOTICE '📊 Functions created: get_enhanced_trainer_stats, get_enhanced_active_clients, get_enhanced_today_sessions, get_enhanced_upcoming_sessions';
  RAISE NOTICE '🔧 Tables enhanced: training_sessions, profiles, session_notifications, client_activity_log';
  RAISE NOTICE '🚀 Your trainer dashboard is now ready to use with enhanced functionality!';
END $$;