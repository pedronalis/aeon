use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

/// Retorna migrations do banco de dados
/// V1: Schema inicial com todas as tabelas
pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_schema",
        sql: r#"
            -- Settings (singleton)
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                active_mode TEXT NOT NULL DEFAULT 'traditional',
                notifications_enabled BOOLEAN NOT NULL DEFAULT 1,
                sound_enabled BOOLEAN NOT NULL DEFAULT 1,
                schema_version INTEGER NOT NULL DEFAULT 1
            );

            -- Insert default settings
            INSERT OR IGNORE INTO settings (id, active_mode, notifications_enabled, sound_enabled, schema_version)
            VALUES (1, 'traditional', 1, 1, 1);

            -- Modes (presets + custom)
            CREATE TABLE IF NOT EXISTS modes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_custom BOOLEAN NOT NULL,
                focus_duration INTEGER NOT NULL,
                short_break_duration INTEGER NOT NULL,
                long_break_duration INTEGER NOT NULL,
                pomodoros_until_long_break INTEGER NOT NULL,
                accent_color TEXT NOT NULL,
                disclaimer TEXT
            );

            -- Insert preset modes
            INSERT OR IGNORE INTO modes VALUES
            ('traditional', 'Tradicional', 0, 1500, 300, 900, 4, '#7aa2f7', 'Preset clássico.'),
            ('sustainable', 'Foco Sustentável', 0, 3000, 600, 1800, 3, '#9ece6a', 'Inspirado em heurísticas de produtividade sustentável.'),
            ('animedoro', 'Animedoro', 0, 2400, 1200, 3600, 2, '#bb9af7', 'Inspirado em pausas com anime/séries curtas.'),
            ('mangadoro', 'Mangadoro', 0, 2700, 900, 2700, 3, '#e0af68', 'Inspirado em pausas com leitura de mangá/HQs.');

            -- Daily stats
            CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT NOT NULL,
                mode_id TEXT NOT NULL,
                pomodoros_completed INTEGER NOT NULL DEFAULT 0,
                total_focus_minutes INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (date, mode_id),
                FOREIGN KEY (mode_id) REFERENCES modes(id)
            );

            -- Achievements
            CREATE TABLE IF NOT EXISTS achievements (
                id TEXT PRIMARY KEY,
                unlocked_at TEXT NOT NULL,
                category TEXT NOT NULL
            );

            -- User progress (singleton)
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_xp INTEGER NOT NULL DEFAULT 0,
                current_streak INTEGER NOT NULL DEFAULT 0,
                best_streak INTEGER NOT NULL DEFAULT 0,
                last_activity_date TEXT
            );

            -- Insert default progress
            INSERT OR IGNORE INTO user_progress (id, total_xp, current_streak, best_streak, last_activity_date)
            VALUES (1, 0, 0, 0, NULL);

            -- User profile (singleton)
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                username TEXT NOT NULL DEFAULT 'Aventureiro',
                avatar_id TEXT NOT NULL DEFAULT 'knight',
                bio TEXT,
                display_title TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            -- Insert default profile
            INSERT OR IGNORE INTO user_profile VALUES (
                1,
                'Aventureiro',
                'knight',
                NULL,
                NULL,
                datetime('now'),
                datetime('now')
            );

            -- Daily quests
            CREATE TABLE IF NOT EXISTS daily_quests (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                target INTEGER NOT NULL,
                current_progress INTEGER NOT NULL DEFAULT 0,
                completed BOOLEAN NOT NULL DEFAULT 0,
                date TEXT NOT NULL,
                xp_reward INTEGER NOT NULL
            );

            -- Weekly quests
            CREATE TABLE IF NOT EXISTS weekly_quests (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                target INTEGER NOT NULL,
                current_progress INTEGER NOT NULL DEFAULT 0,
                completed BOOLEAN NOT NULL DEFAULT 0,
                week_start TEXT NOT NULL,
                xp_reward INTEGER NOT NULL
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
            CREATE INDEX IF NOT EXISTS idx_daily_stats_mode ON daily_stats(mode_id);
        "#,
        kind: MigrationKind::Up,
    },
    Migration {
        version: 2,
        description: "add_tasks_tables",
        sql: r#"
            -- Tasks (Pergaminhos)
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                effort TEXT NOT NULL DEFAULT 'common',
                status TEXT NOT NULL DEFAULT 'pending',
                xp_reward INTEGER NOT NULL,
                xp_penalty INTEGER NOT NULL,
                xp_earned INTEGER DEFAULT 0,
                deadline TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                linked_pomodoros INTEGER DEFAULT 0
            );

            -- Subtasks (Etapas)
            CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                xp_reward INTEGER NOT NULL,
                completed_at TEXT,
                sort_order INTEGER DEFAULT 0,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
            CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
        "#,
        kind: MigrationKind::Up,
    },
    Migration {
        version: 3,
        description: "add_task_sort_order",
        sql: r#"
            -- Add sort_order column to tasks for manual ordering
            ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;

            -- Create index for ordering
            CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
        "#,
        kind: MigrationKind::Up,
    }]
}

/// Configura e retorna o plugin SQL
pub fn setup_database() -> tauri_plugin_sql::Builder {
    SqlBuilder::default()
        .add_migrations("sqlite:pomodore.db", get_migrations())
}
