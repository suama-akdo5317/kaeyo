-- items, categories, groups テーブルを supabase_realtime publication に追加する。
-- この設定がないと postgres_changes イベントがクライアントへ届かない。
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table groups;
