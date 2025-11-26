#pragma once

#include "BangGuChaMapGenerator.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"

UCLASS()
class BANGGUCHA_API ABangGuChaMapGenerator : public AActor {
  GENERATED_BODY()

public:
  ABangGuChaMapGenerator();

protected:
  virtual void BeginPlay() override;

public:
  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Map Generation")
  int32 MapWidth;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Map Generation")
  int32 MapHeight;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Map Generation")
  float GridSize;

  UPROPERTY(EditDefaultsOnly, Category = "Map Generation")
  TSubclassOf<class AActor> WallClass;

  UPROPERTY(EditDefaultsOnly, Category = "Map Generation")
  TSubclassOf<class AActor> ItemClass;

  UPROPERTY(EditDefaultsOnly, Category = "Map Generation")
  TSubclassOf<class APawn> EnemyClass;

  UFUNCTION(BlueprintCallable, Category = "Map Generation")
  void GenerateMap();

private:
  void SpawnWall(int32 X, int32 Y);
  void SpawnItem(int32 X, int32 Y);
  void SpawnEnemy(int32 X, int32 Y);
};
