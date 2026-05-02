USE qr_attendance_system;

-- Run once on an existing database created before content_path was added:
ALTER TABLE Course ADD COLUMN content_path VARCHAR(255) NULL AFTER instructor_id;
