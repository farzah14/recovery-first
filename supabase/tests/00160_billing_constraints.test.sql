begin;

select plan(3);

select has_table('private', 'billing_customers', 'private billing customers table exists');
select has_table('private', 'billing_subscriptions', 'private billing subscriptions table exists');
select has_table('private', 'checkout_attempts', 'private checkout attempts table exists');

select * from finish();
rollback;
