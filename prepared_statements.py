def prepare_statement(conn, name, sql):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT name FROM pg_prepared_statements WHERE name = '{name}';
    """)
    if cur.fetchone():
        cur.execute(f"DEALLOCATE {name}")
    cur.execute(sql)