var builder = DistributedApplication.CreateBuilder(args);

// Spin up a Postgres container and a database on it.
var postgres = builder.AddPostgres("postgres");
var shopdb = postgres.AddDatabase("shopdb");

// The console app gets the "shopdb" connection string injected, and only
// starts once Postgres is healthy.
builder.AddProject<Projects.SpecificationPattern>("app")
    .WithReference(shopdb)
    .WaitFor(shopdb);

builder.Build().Run();
