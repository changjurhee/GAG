#include "BangGuChaMapGenerator.h"
#include "BangGuChaGameModeBase.h"

ABangGuChaMapGenerator::ABangGuChaMapGenerator() {
  PrimaryActorTick.bCanEverTick = false;

  MapWidth = 20;
  MapHeight = 15;
  GridSize = 100.f;
}

void ABangGuChaMapGenerator::BeginPlay() {
  Super::BeginPlay();
  GenerateMap();
}

void ABangGuChaMapGenerator::GenerateMap() {
  if (!WallClass || !ItemClass)
    return;

  ABangGuChaGameModeBase *GM =
      Cast<ABangGuChaGameModeBase>(GetWorld()->GetAuthGameMode());
  int32 FlagCount = 0;

  for (int32 x = 0; x < MapWidth; x++) {
    for (int32 y = 0; y < MapHeight; y++) {
      // Border Walls
      if (x == 0 || x == MapWidth - 1 || y == 0 || y == MapHeight - 1) {
        SpawnWall(x, y);
        continue;
      }

      // Safe Zone (Top-Left for Player)
      if (x < 3 && y < 3)
        continue;

      // Random Inner Walls (10% chance)
      if (FMath::RandRange(0.f, 1.f) < 0.1f) {
        SpawnWall(x, y);
        continue;
      }

      // Random Items (5% chance)
      if (FMath::RandRange(0.f, 1.f) < 0.05f) {
        SpawnItem(x, y);
        FlagCount++;
      }
    }
  }

  // Spawn Enemies at opposite corners
  if (EnemyClass) {
    SpawnEnemy(MapWidth - 2, MapHeight - 2);
    SpawnEnemy(MapWidth - 2, 1);
  }

  if (GM) {
    GM->TotalFlags = FlagCount;
  }
}

void ABangGuChaMapGenerator::SpawnWall(int32 X, int32 Y) {
  FVector Location(X * GridSize, Y * GridSize, 50.f);
  GetWorld()->SpawnActor<AActor>(WallClass, Location, FRotator::ZeroRotator);
}

void ABangGuChaMapGenerator::SpawnItem(int32 X, int32 Y) {
  FVector Location(X * GridSize, Y * GridSize, 50.f);
  GetWorld()->SpawnActor<AActor>(ItemClass, Location, FRotator::ZeroRotator);
}

void ABangGuChaMapGenerator::SpawnEnemy(int32 X, int32 Y) {
  FVector Location(X * GridSize, Y * GridSize, 50.f);
  GetWorld()->SpawnActor<AActor>(EnemyClass, Location, FRotator::ZeroRotator);
}
